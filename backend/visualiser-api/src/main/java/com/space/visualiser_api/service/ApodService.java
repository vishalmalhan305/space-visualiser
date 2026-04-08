package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.ApodEntry;
import com.space.visualiser_api.repository.ApodRepository;
import io.micrometer.core.instrument.Counter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class ApodService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApodService.class);

    private final ApodRepository apodRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration cacheTtl;
    private final Counter cacheHitsCounter;
    private final Counter cacheMissesCounter;

    public ApodService(
            ApodRepository apodRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Qualifier("spaceCacheHitsCounter") Counter cacheHitsCounter,
            @Qualifier("spaceCacheMissesCounter") Counter cacheMissesCounter,
            @Value("${app.apod.cache-ttl:PT24H}") Duration cacheTtl
    ) {
        this.apodRepository = apodRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.cacheHitsCounter = cacheHitsCounter;
        this.cacheMissesCounter = cacheMissesCounter;
        this.cacheTtl = cacheTtl;
    }

    public ApodEntry getToday() {
        return getByDate(LocalDate.now(ZoneOffset.UTC));
    }

    public List<ApodEntry> getArchive(int count) {
        String cacheKey = "apod:archive:" + count;
        String cached;
        try {
            cached = redisTemplate.opsForValue().get(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis read failed for APOD cache key {}", cacheKey, exception);
            cached = null;
        }
        if (cached != null && !cached.isBlank()) {
            try {
                LOGGER.debug("Cache HIT for key {}", cacheKey);
                cacheHitsCounter.increment();
                return objectMapper.readValue(cached, new TypeReference<List<ApodEntry>>() {});
            } catch (JsonProcessingException e) {
                safeDeleteCacheKey(cacheKey);
            }
        }
        LOGGER.debug("Cache MISS for key {}", cacheKey);
        cacheMissesCounter.increment();

        PageRequest page = PageRequest.of(0, count, Sort.by(Sort.Direction.DESC, "date"));
        List<ApodEntry> entries = apodRepository.findAll(page).getContent();

        writeArchiveToCache(cacheKey, entries);

        return entries;
    }

    public ApodEntry getByDate(LocalDate date) {
        String cacheKey = buildCacheKey(date);
        ApodEntry cachedEntry = readFromCache(cacheKey);
        if (cachedEntry != null) {
            LOGGER.debug("Cache HIT for key {}", cacheKey);
            cacheHitsCounter.increment();
            return cachedEntry;
        }
        LOGGER.debug("Cache MISS for key {}", cacheKey);
        cacheMissesCounter.increment();

        ApodEntry apodEntry = apodRepository.findById(date)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "APOD entry not found for date " + date
                ));

        writeToCache(cacheKey, apodEntry);
        return apodEntry;
    }

    public List<ApodEntry> getByDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "start must be before or equal to end"
            );
        }

        String cacheKey = buildRangeCacheKey(startDate, endDate);
        String cachedValue;
        try {
            cachedValue = redisTemplate.opsForValue().get(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis read failed for APOD cache key {}", cacheKey, exception);
            cachedValue = null;
        }

        if (cachedValue != null && !cachedValue.isBlank()) {
            try {
                LOGGER.debug("Cache HIT for key {}", cacheKey);
                cacheHitsCounter.increment();
                return objectMapper.readValue(cachedValue, new TypeReference<>() {
                });
            } catch (JsonProcessingException exception) {
                safeDeleteCacheKey(cacheKey);
            }
        }

        LOGGER.debug("Cache MISS for key {}", cacheKey);
        cacheMissesCounter.increment();
        List<ApodEntry> entries = apodRepository.findByDateBetweenOrderByDateAsc(startDate, endDate);
        writeArchiveToCache(cacheKey, entries);
        return entries;
    }

    private ApodEntry readFromCache(String cacheKey) {
        String cachedValue;
        try {
            cachedValue = redisTemplate.opsForValue().get(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis read failed for APOD cache key {}", cacheKey, exception);
            return null;
        }
        if (cachedValue == null || cachedValue.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(cachedValue, ApodEntry.class);
        } catch (JsonProcessingException exception) {
            safeDeleteCacheKey(cacheKey);
            return null;
        }
    }

    private void writeToCache(String cacheKey, ApodEntry apodEntry) {
        try {
            String payload = objectMapper.writeValueAsString(apodEntry);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Failed to serialize APOD entry for cache key {}", cacheKey, exception);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis write failed for APOD cache key {}", cacheKey, exception);
        }
    }

    private void writeArchiveToCache(String cacheKey, List<ApodEntry> entries) {
        try {
            String payload = objectMapper.writeValueAsString(entries);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Failed to serialize APOD archive for cache key {}", cacheKey, exception);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis write failed for APOD cache key {}", cacheKey, exception);
        }
    }

    private void safeDeleteCacheKey(String cacheKey) {
        try {
            redisTemplate.delete(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis delete failed for APOD cache key {}", cacheKey, exception);
        }
    }

    private String buildCacheKey(LocalDate date) {
        return "apod:" + date;
    }

    private String buildRangeCacheKey(LocalDate startDate, LocalDate endDate) {
        return "apod:range:" + startDate + ":" + endDate;
    }
}
