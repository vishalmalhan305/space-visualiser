package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.visualiser.dto.AsteroidOrbitDto;
import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.repository.AsteroidRepository;
import com.space.visualiser_api.visualiser.ingestion.NeoWsIngestionJob;
import io.micrometer.core.instrument.Counter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.space.visualiser_api.visualiser.dto.NeoWsResponseDto;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class AsteroidService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AsteroidService.class);

    private final AsteroidRepository asteroidRepository;
    private final NeoWsIngestionJob neoWsIngestionJob;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration cacheTtl;
    private final Counter cacheHitsCounter;
    private final Counter cacheMissesCounter;
    private final WebClient nasaWebClient;
    private final String nasaApiKey;
    private final io.micrometer.core.instrument.Timer asteroidQueryTimer;

    public AsteroidService(
            AsteroidRepository asteroidRepository,
            NeoWsIngestionJob neoWsIngestionJob,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Qualifier("spaceCacheHitsCounter") Counter cacheHitsCounter,
            @Qualifier("spaceCacheMissesCounter") Counter cacheMissesCounter,
            @Qualifier("asteroidQueryTimer") io.micrometer.core.instrument.Timer asteroidQueryTimer,
            WebClient nasaWebClient,
            @Value("${app.nasa.api-key:${NASA_API_KEY:DEMO_KEY}}") String nasaApiKey,
            @Value("${app.asteroids.cache-ttl:PT6H}") Duration cacheTtl
    ) {
        this.asteroidRepository = asteroidRepository;
        this.neoWsIngestionJob = neoWsIngestionJob;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.cacheHitsCounter = cacheHitsCounter;
        this.cacheMissesCounter = cacheMissesCounter;
        this.asteroidQueryTimer = asteroidQueryTimer;
        this.nasaWebClient = nasaWebClient;
        this.nasaApiKey = nasaApiKey;
        this.cacheTtl = cacheTtl;
    }

    public List<Asteroid> getCurrentWeek() {
        LocalDate startDate = LocalDate.now(ZoneOffset.UTC);
        return getByDateRange(startDate, startDate.plusDays(6));
    }

    public Page<Asteroid> getAsteroidsPage(LocalDate start, LocalDate end, Boolean hazardous, String sortBy, String sortDir, int page, int size) {
        return asteroidQueryTimer.record(() -> {
            Sort sort = Sort.by(Sort.Direction.fromString(sortDir), mapSortBy(sortBy));
            Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort); // Bounded page size

            String cacheKey = buildPagedCacheKey(start, end, hazardous, sortBy, sortDir, page, size);
            Page<Asteroid> cachedPage = readPageFromCache(cacheKey);
            if (cachedPage != null) {
                LOGGER.debug("Cache HIT for paged key {}", cacheKey);
                cacheHitsCounter.increment();
                return cachedPage;
            }

            LOGGER.debug("Cache MISS for paged key {}", cacheKey);
            cacheMissesCounter.increment();

            Page<Asteroid> resultPage = asteroidRepository.findWithFilters(hazardous, start, end, pageable);

            writePageToCache(cacheKey, resultPage);
            return resultPage;
        });
    }

    private String mapSortBy(String sortBy) {
        return switch (sortBy) {
            case "name" -> "name";
            case "size" -> "averageDiameterKm";
            case "velocity" -> "velocity_kmh";
            case "missDistance" -> "missDistanceKm";
            default -> "closeApproachDate";
        };
    }

    private String buildPagedCacheKey(LocalDate start, LocalDate end, Boolean hazardous, String sortBy, String sortDir, int page, int size) {
        StringBuilder sb = new StringBuilder("asteroids:page:");
        if (start != null && end != null) {
            sb.append(start).append(":").append(end);
        } else {
            // Default weekly view normalization
            java.time.temporal.TemporalField woy = java.time.temporal.WeekFields.of(java.util.Locale.US).weekOfWeekBasedYear();
            int week = LocalDate.now(ZoneOffset.UTC).get(woy);
            int year = LocalDate.now(ZoneOffset.UTC).getYear();
            sb.append(year).append("-W").append(week);
        }
        sb.append(":p").append(page)
          .append(":s").append(size)
          .append(":h").append(hazardous)
          .append(":sb").append(sortBy)
          .append(":sd").append(sortDir);
        return sb.toString();
    }

    private Page<Asteroid> readPageFromCache(String cacheKey) {
        String cachedValue;
        try {
            cachedValue = redisTemplate.opsForValue().get(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis read failed for asteroid page cache key {}", cacheKey, exception);
            return null;
        }
        if (cachedValue == null || cachedValue.isBlank()) {
            return null;
        }

        try {
            CachedAsteroidPage cachedPage = objectMapper.readValue(cachedValue, CachedAsteroidPage.class);
            return new org.springframework.data.domain.PageImpl<>(
                cachedPage.getContent(),
                PageRequest.of(cachedPage.getNumber(), cachedPage.getSize()),
                cachedPage.getTotalElements()
            );
        } catch (JsonProcessingException exception) {
            safeDeleteCacheKey(cacheKey);
            return null;
        }
    }

    private void writePageToCache(String cacheKey, Page<Asteroid> page) {
        try {
            CachedAsteroidPage dto = new CachedAsteroidPage(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
            );
            String payload = objectMapper.writeValueAsString(dto);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Failed to serialize asteroid page for cache key {}", cacheKey, exception);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis write failed for asteroid page cache key {}", cacheKey, exception);
        }
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class CachedAsteroidPage {
        private List<Asteroid> content;
        private long totalElements;
        private int totalPages;
        private int number;
        private int size;
    }

    public List<Asteroid> getByDateRange(LocalDate startDate, LocalDate endDate) {
        String cacheKey = buildCacheKey(startDate, endDate);
        List<Asteroid> cachedAsteroids = readFromCache(cacheKey);
        if (cachedAsteroids != null) {
            LOGGER.debug("Cache HIT for key {}", cacheKey);
            cacheHitsCounter.increment();
            return cachedAsteroids;
        }
        LOGGER.debug("Cache MISS for key {}", cacheKey);
        cacheMissesCounter.increment();

        List<Asteroid> asteroids = asteroidRepository
                .findByCloseApproachDateBetweenOrderByCloseApproachDateAsc(startDate, endDate);
        if (asteroids.isEmpty()) {
            asteroids = backfillFromSource(startDate, endDate);
        }
        if (asteroids.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Asteroids not found for range " + startDate + " to " + endDate
            );
        }

        writeToCache(cacheKey, asteroids);
        return asteroids;
    }

    public Asteroid getByNeoId(String neoId) {
        return asteroidRepository.findById(neoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Asteroid not found for neoId " + neoId
                ));
    }

    public AsteroidOrbitDto getOrbitByNeoId(String neoId) {
        Asteroid asteroid = getByNeoId(neoId);
        
        // If orbital data is missing (all zeros), try to fetch from NASA on-demand
        if (isOrbitalDataMissing(asteroid)) {
            LOGGER.info("Orbital data missing for asteroid {}, fetching from NASA details...", neoId);
            try {
                enrichOrbitalData(asteroid);
                asteroidRepository.save(asteroid);
                LOGGER.info("Enriched orbital data for asteroid {}", neoId);
            } catch (Exception e) {
                LOGGER.warn("Failed to enrich orbital data for asteroid {}: {}", neoId, e.getMessage());
            }
        }

        return new AsteroidOrbitDto(
                asteroid.getNeoId(),
                asteroid.getName(),
                asteroid.getSemi_major_axis(),
                asteroid.getEccentricity(),
                asteroid.getInclination(),
                orDefault(asteroid.getAscendingNodeLongitude()),
                orDefault(asteroid.getPerihelionArgument()),
                orDefault(asteroid.getMeanAnomaly()),
                orDefault(asteroid.getEpochOsculation())
        );
    }

    private boolean isOrbitalDataMissing(Asteroid asteroid) {
        return asteroid.getSemi_major_axis() == 0.0
            && asteroid.getEccentricity() == 0.0
            && asteroid.getInclination() == 0.0;
    }

    private void enrichOrbitalData(Asteroid asteroid) {
        NeoWsResponseDto.NearEarthObjectDto detailResponse = nasaWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/neo/rest/v1/neo/" + asteroid.getNeoId())
                        .queryParam("api_key", nasaApiKey)
                        .build())
                .retrieve()
                .bodyToMono(NeoWsResponseDto.NearEarthObjectDto.class)
                .block();

        if (detailResponse != null && detailResponse.getOrbitalData() != null) {
            System.out.println("Found orbital data for asteroid " + asteroid.getNeoId());
            NeoWsResponseDto.OrbitalDataDto od = detailResponse.getOrbitalData();
            asteroid.setSemi_major_axis(parseDoubleOrDefault(od.getSemiMajorAxis()));
            asteroid.setEccentricity(parseDoubleOrDefault(od.getEccentricity()));
            asteroid.setInclination(parseDoubleOrDefault(od.getInclination()));
            asteroid.setAscendingNodeLongitude(parseDoubleOrNull(od.getAscendingNodeLongitude()));
            asteroid.setPerihelionArgument(parseDoubleOrNull(od.getPerihelionArgument()));
            asteroid.setMeanAnomaly(parseDoubleOrNull(od.getMeanAnomaly()));
            asteroid.setEpochOsculation(parseDoubleOrNull(od.getEpochOsculation()));
        } else {
            System.out.println("Orbital data was null for asteroid " + asteroid.getNeoId());
        }
    }

    private double parseDoubleOrDefault(String value) {
        if (value == null || value.isBlank()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private Double parseDoubleOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private double orDefault(Double value) {
        return value != null ? value : 0.0;
    }

    private List<Asteroid> backfillFromSource(LocalDate startDate, LocalDate endDate) {
        try {
            neoWsIngestionJob.fetchAsteroidsForRange(startDate, endDate);
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(
                    HttpStatusCode.valueOf(502),
                    "Failed to fetch asteroids from NASA source",
                    exception
            );
        }

        return asteroidRepository.findByCloseApproachDateBetweenOrderByCloseApproachDateAsc(startDate, endDate);
    }

    private List<Asteroid> readFromCache(String cacheKey) {
        String cachedValue;
        try {
            cachedValue = redisTemplate.opsForValue().get(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis read failed for asteroid cache key {}", cacheKey, exception);
            return null;
        }
        if (cachedValue == null || cachedValue.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(cachedValue, new TypeReference<>() {
            });
        } catch (JsonProcessingException exception) {
            safeDeleteCacheKey(cacheKey);
            return null;
        }
    }

    private void writeToCache(String cacheKey, List<Asteroid> asteroids) {
        try {
            String payload = objectMapper.writeValueAsString(asteroids);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Failed to serialize asteroid list for cache key {}", cacheKey, exception);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis write failed for asteroid cache key {}", cacheKey, exception);
        }
    }

    private void safeDeleteCacheKey(String cacheKey) {
        try {
            redisTemplate.delete(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis delete failed for asteroid cache key {}", cacheKey, exception);
        }
    }

    private String buildCacheKey(LocalDate startDate, LocalDate endDate) {
        return "asteroids:" + startDate + ":" + endDate;
    }
}
