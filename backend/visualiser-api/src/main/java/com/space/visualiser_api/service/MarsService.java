package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.MarsPhoto;
import com.space.visualiser_api.repository.MarsPhotoRepository;
import com.space.visualiser_api.visualiser.dto.NasaMarsPhotoResponseDto;
import io.micrometer.core.instrument.Counter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class MarsService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MarsService.class);

    private final MarsPhotoRepository marsPhotoRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final WebClient nasaWebClient;
    private final String nasaApiKey;
    private final Duration cacheTtl;
    private final Counter cacheHitsCounter;
    private final Counter cacheMissesCounter;

    public MarsService(
            MarsPhotoRepository marsPhotoRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            WebClient nasaWebClient,
            @Value("${app.nasa.api-key:${NASA_API_KEY:DEMO_KEY}}") String nasaApiKey,
            @Qualifier("spaceCacheHitsCounter") Counter cacheHitsCounter,
            @Qualifier("spaceCacheMissesCounter") Counter cacheMissesCounter,
            @Value("${app.mars.cache-ttl:P7D}") Duration cacheTtl
    ) {
        this.marsPhotoRepository = marsPhotoRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.nasaWebClient = nasaWebClient;
        this.nasaApiKey = nasaApiKey;
        this.cacheHitsCounter = cacheHitsCounter;
        this.cacheMissesCounter = cacheMissesCounter;
        this.cacheTtl = cacheTtl;
    }

    public List<MarsPhoto> getPhotos(String rover, String camera, Integer sol) {
        String safeRover = rover == null ? "" : rover.trim().toLowerCase(Locale.ROOT);
        String safeCamera = normalizeCamera(camera);

        String cacheKey = buildCacheKey(safeRover, safeCamera, sol);
        List<MarsPhoto> cachedPhotos = readFromCache(cacheKey);

        if (cachedPhotos != null) {
            LOGGER.debug("Cache HIT for key {}", cacheKey);
            cacheHitsCounter.increment();
            return cachedPhotos;
        }

        LOGGER.debug("Cache MISS for key {}", cacheKey);
        cacheMissesCounter.increment();

        List<MarsPhoto> dbPhotos = safeCamera == null
                ? marsPhotoRepository.findByRoverAndSol(safeRover, sol)
                : marsPhotoRepository.findByRoverAndCameraAndSol(safeRover, safeCamera, sol);

        if (dbPhotos.isEmpty()) {
            LOGGER.info("Mars photos missing in DB for rover {}, camera {}, sol {}. Fetching from NASA", safeRover, safeCamera, sol);
            dbPhotos = fetchPhotosFromNasa(safeRover, safeCamera, sol);
            
            // Limit to 50 to avoid huge payloads and DB operations
            if (dbPhotos.size() > 50) {
                dbPhotos = dbPhotos.subList(0, 50);
            }

            if (!dbPhotos.isEmpty()) {
                marsPhotoRepository.saveAll(dbPhotos);
            }
        }

        writeToCache(cacheKey, dbPhotos);
        return dbPhotos;
    }

    private List<MarsPhoto> fetchPhotosFromNasa(String rover, String camera, Integer sol) {
        try {
            NasaMarsPhotoResponseDto response = nasaWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/mars-photos/api/v1/rovers/{rover}/photos")
                            .queryParam("sol", sol)
                            .queryParam("api_key", nasaApiKey)
                            .queryParamIfPresent("camera", java.util.Optional.ofNullable(camera))
                            .build(rover))
                    .retrieve()
                    .bodyToMono(NasaMarsPhotoResponseDto.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            if (response == null || response.getPhotos() == null) {
                return Collections.emptyList();
            }

            return response.getPhotos().stream().map(dto -> {
                LocalDate earthDate;
                try {
                    earthDate = LocalDate.parse(dto.getEarthDate());
                } catch (DateTimeParseException | NullPointerException e) {
                    earthDate = LocalDate.now();
                }

                return MarsPhoto.builder()
                        .photoId(dto.getId())
                        .rover(rover)
                        .camera(resolveCamera(camera, dto.getCamera() == null ? null : dto.getCamera().getName()))
                        .sol(dto.getSol() != null ? dto.getSol() : sol)
                        .earthDate(earthDate)
                        .imgSrc(dto.getImgSrc())
                        .build();
            }).filter(photo -> photo.getCamera() != null && !photo.getCamera().isBlank())
                    .collect(Collectors.toList());

        } catch (WebClientResponseException exception) {
            LOGGER.error("Failed to fetch Mars photos from NASA. Status: {}", exception.getStatusCode(), exception);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Failed to fetch data from NASA Mars Photos API",
                    exception
            );
        } catch (Exception exception) {
            LOGGER.error("Error during NASA Mars Photos API call", exception);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unexpected error communicating with external API",
                    exception
            );
        }
    }

    private List<MarsPhoto> readFromCache(String cacheKey) {
        String cachedValue;
        try {
            cachedValue = redisTemplate.opsForValue().get(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis read failed for Mars cache key {}", cacheKey, exception);
            return null;
        }

        if (cachedValue == null || cachedValue.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(cachedValue, new TypeReference<List<MarsPhoto>>() {});
        } catch (JsonProcessingException exception) {
            safeDeleteCacheKey(cacheKey);
            return null;
        }
    }

    private void writeToCache(String cacheKey, List<MarsPhoto> photos) {
        try {
            String payload = objectMapper.writeValueAsString(photos);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Failed to serialize Mars photos for cache key {}", cacheKey, exception);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis write failed for Mars cache key {}", cacheKey, exception);
        }
    }

    private void safeDeleteCacheKey(String cacheKey) {
        try {
            redisTemplate.delete(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis delete failed for Mars cache key {}", cacheKey, exception);
        }
    }

    private String buildCacheKey(String rover, String camera, Integer sol) {
        String cameraKey = camera == null ? "all" : camera;
        return "mars:photos:" + rover + ":" + cameraKey + ":sol:" + sol;
    }

    private String normalizeCamera(String camera) {
        if (camera == null) {
            return null;
        }
        String normalized = camera.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty() || Objects.equals(normalized, "all")) {
            return null;
        }
        return normalized;
    }

    private String resolveCamera(String requestedCamera, String cameraFromNasa) {
        if (requestedCamera != null && !requestedCamera.isBlank()) {
            return requestedCamera;
        }
        if (cameraFromNasa == null || cameraFromNasa.isBlank()) {
            return null;
        }
        return cameraFromNasa.toLowerCase(Locale.ROOT);
    }
}
