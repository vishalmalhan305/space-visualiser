package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.MarsPhoto;
import com.space.visualiser_api.repository.MarsPhotoRepository;
import com.space.visualiser_api.visualiser.dto.NasaImageLibraryResponseDto;
import io.micrometer.core.instrument.Counter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class MarsService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MarsService.class);
    private static final int MAX_PHOTOS = 50;

    private final MarsPhotoRepository marsPhotoRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final WebClient nasaImageWebClient;
    private final Duration cacheTtl;
    private final Counter cacheHitsCounter;
    private final Counter cacheMissesCounter;

    public MarsService(
            MarsPhotoRepository marsPhotoRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Qualifier("nasaImageWebClient") WebClient nasaImageWebClient,
            @Qualifier("spaceCacheHitsCounter") Counter cacheHitsCounter,
            @Qualifier("spaceCacheMissesCounter") Counter cacheMissesCounter,
            @Value("${app.mars.cache-ttl:P7D}") Duration cacheTtl
    ) {
        this.marsPhotoRepository = marsPhotoRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.nasaImageWebClient = nasaImageWebClient;
        this.cacheHitsCounter = cacheHitsCounter;
        this.cacheMissesCounter = cacheMissesCounter;
        this.cacheTtl = cacheTtl;
    }

    public List<MarsPhoto> getPhotos(String rover) {
        String safeRover = rover == null ? "" : rover.trim().toLowerCase(Locale.ROOT);
        String cacheKey = "mars:photos:" + safeRover;

        List<MarsPhoto> cachedPhotos = readFromCache(cacheKey);
        if (cachedPhotos != null) {
            LOGGER.debug("Cache HIT for key {}", cacheKey);
            cacheHitsCounter.increment();
            return cachedPhotos;
        }

        LOGGER.debug("Cache MISS for key {}", cacheKey);
        cacheMissesCounter.increment();

        List<MarsPhoto> dbPhotos = marsPhotoRepository.findByRoverIgnoreCase(safeRover);
        if (dbPhotos.size() > MAX_PHOTOS) {
            dbPhotos = dbPhotos.subList(0, MAX_PHOTOS);
        }

        if (dbPhotos.isEmpty()) {
            LOGGER.info("Mars photos missing in DB for rover {}. Fetching from NASA Image Library", safeRover);
            dbPhotos = fetchPhotosFromNasa(safeRover);

            if (!dbPhotos.isEmpty()) {
                marsPhotoRepository.saveAll(dbPhotos);
            }
        }

        writeToCache(cacheKey, dbPhotos);
        return dbPhotos;
    }

    private List<MarsPhoto> fetchPhotosFromNasa(String rover) {
        try {
            String query = rover + " mars rover";
            NasaImageLibraryResponseDto response = nasaImageWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search")
                            .queryParam("q", query)
                            .queryParam("media_type", "image")
                            .queryParam("page_size", MAX_PHOTOS)
                            .build())
                    .retrieve()
                    .bodyToMono(NasaImageLibraryResponseDto.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            if (response == null
                    || response.getCollection() == null
                    || response.getCollection().getItems() == null) {
                return Collections.emptyList();
            }

            return response.getCollection().getItems().stream()
                    .filter(item -> item.getData() != null && !item.getData().isEmpty())
                    .filter(item -> item.getLinks() != null && !item.getLinks().isEmpty())
                    .map(item -> {
                        NasaImageLibraryResponseDto.ItemData data = item.getData().get(0);
                        String imgSrc = item.getLinks().stream()
                                .filter(link -> "preview".equals(link.getRel()))
                                .map(NasaImageLibraryResponseDto.ItemLink::getHref)
                                .findFirst()
                                .orElse(item.getLinks().get(0).getHref());

                        LocalDate earthDate = parseDate(data.getDateCreated());
                        long photoId = toPhotoId(data.getNasaId());

                        String keywords = data.getKeywords() == null ? null
                                : String.join(",", data.getKeywords());

                        return MarsPhoto.builder()
                                .photoId(photoId)
                                .rover(rover)
                                .camera(null)
                                .sol(null)
                                .earthDate(earthDate)
                                .imgSrc(imgSrc)
                                .title(data.getTitle())
                                .description(data.getDescription())
                                .keywords(keywords)
                                .build();
                    })
                    .limit(MAX_PHOTOS)
                    .collect(Collectors.toList());

        } catch (WebClientResponseException exception) {
            LOGGER.error(
                    "Failed to fetch Mars photos from NASA Image Library. Status: {}",
                    exception.getStatusCode(), exception);
            return Collections.emptyList();
        } catch (Exception exception) {
            LOGGER.error("Error during NASA Image Library API call", exception);
            return Collections.emptyList();
        }
    }

    private LocalDate parseDate(String dateCreated) {
        if (dateCreated == null || dateCreated.isBlank()) {
            return LocalDate.now();
        }
        try {
            // NASA Image Library returns ISO-8601 datetime e.g. "2021-03-18T00:00:00Z"
            return LocalDate.parse(dateCreated.substring(0, 10));
        } catch (DateTimeParseException | IndexOutOfBoundsException e) {
            return LocalDate.now();
        }
    }

    private long toPhotoId(String nasaId) {
        if (nasaId == null || nasaId.isBlank()) {
            return Math.abs(System.nanoTime()) % 9007199254740991L;
        }
        long hash = 1125899906842597L;
        for (char c : nasaId.toCharArray()) {
            hash = 31L * hash + c;
        }
        // Cap to JS Number.MAX_SAFE_INTEGER (2^53 - 1) to avoid precision loss in JSON
        return Math.abs(hash) % 9007199254740991L;
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
}
