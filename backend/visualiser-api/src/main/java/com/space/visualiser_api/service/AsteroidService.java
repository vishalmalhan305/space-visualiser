package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.controller.dto.AsteroidOrbitDto;
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

    public AsteroidService(
            AsteroidRepository asteroidRepository,
            NeoWsIngestionJob neoWsIngestionJob,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Qualifier("spaceCacheHitsCounter") Counter cacheHitsCounter,
            @Qualifier("spaceCacheMissesCounter") Counter cacheMissesCounter,
            @Value("${app.asteroids.cache-ttl:PT6H}") Duration cacheTtl
    ) {
        this.asteroidRepository = asteroidRepository;
        this.neoWsIngestionJob = neoWsIngestionJob;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.cacheHitsCounter = cacheHitsCounter;
        this.cacheMissesCounter = cacheMissesCounter;
        this.cacheTtl = cacheTtl;
    }

    public List<Asteroid> getCurrentWeek() {
        LocalDate startDate = LocalDate.now(ZoneOffset.UTC);
        return getByDateRange(startDate, startDate.plusDays(6));
    }

    public Page<Asteroid> getAsteroidsPage(Boolean hazardous, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("closeApproachDate").descending());
        if (hazardous != null) {
            return asteroidRepository.findByPotentiallyHazardous(hazardous, pageable);
        }
        return asteroidRepository.findAll(pageable);
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
        return new AsteroidOrbitDto(
                asteroid.getNeoId(),
                asteroid.getName(),
                asteroid.getSemi_major_axis(),
                asteroid.getEccentricity(),
                asteroid.getInclination()
        );
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
