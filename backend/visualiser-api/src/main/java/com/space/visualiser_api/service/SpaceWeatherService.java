package com.space.visualiser_api.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.controller.dto.MonthlyWeatherStatsDto;
import com.space.visualiser_api.entity.SpaceWeatherEvent;
import com.space.visualiser_api.repository.SpaceWeatherEventRepository;
import io.micrometer.core.instrument.Counter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class SpaceWeatherService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SpaceWeatherService.class);

    private final SpaceWeatherEventRepository repository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration cacheTtl;
    private final Counter cacheHitsCounter;
    private final Counter cacheMissesCounter;

    public SpaceWeatherService(
            SpaceWeatherEventRepository repository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Qualifier("spaceCacheHitsCounter") Counter cacheHitsCounter,
            @Qualifier("spaceCacheMissesCounter") Counter cacheMissesCounter,
            @Value("${app.weather.cache-ttl:PT6H}") Duration cacheTtl
    ) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.cacheHitsCounter = cacheHitsCounter;
        this.cacheMissesCounter = cacheMissesCounter;
        this.cacheTtl = cacheTtl;
    }

    public List<SpaceWeatherEvent> getRecentEvents(int days) {
        LocalDate todayUtc = LocalDate.now(ZoneOffset.UTC);
        String cacheKey = buildCacheKey(todayUtc, days);
        List<SpaceWeatherEvent> cachedEvents = readFromCache(cacheKey);
        if (cachedEvents != null) {
            LOGGER.debug("Cache HIT for key {}", cacheKey);
            cacheHitsCounter.increment();
            return cachedEvents;
        }
        LOGGER.debug("Cache MISS for key {}", cacheKey);
        cacheMissesCounter.increment();

        LocalDateTime startTime = todayUtc.atStartOfDay().minusDays(days);
        List<SpaceWeatherEvent> events =
                repository.findByStartTimeGreaterThanEqualOrderByStartTimeDesc(startTime);
        writeToCache(cacheKey, events);
        return events;
    }

    public List<MonthlyWeatherStatsDto> getMonthlyStats() {
        LocalDateTime fromDate = LocalDate.of(2015, 1, 1).atStartOfDay();
        List<SpaceWeatherEventRepository.MonthlyEventCountProjection> aggregated =
                repository.countMonthlyFrom(fromDate);

        Map<YearMonth, Long> countsByMonth = new HashMap<>();
        for (SpaceWeatherEventRepository.MonthlyEventCountProjection item : aggregated) {
            if (item.getYear() == null || item.getMonth() == null || item.getCount() == null) {
                continue;
            }
            countsByMonth.put(YearMonth.of(item.getYear(), item.getMonth()), item.getCount());
        }

        YearMonth start = YearMonth.of(2015, 1);
        YearMonth end = YearMonth.now(ZoneOffset.UTC);
        List<MonthlyWeatherStatsDto> result = new java.util.ArrayList<>();
        YearMonth current = start;
        while (!current.isAfter(end)) {
            long count = countsByMonth.getOrDefault(current, 0L);
            result.add(new MonthlyWeatherStatsDto(current.getYear(), current.getMonthValue(), count));
            current = current.plusMonths(1);
        }
        return result;
    }

    private List<SpaceWeatherEvent> readFromCache(String cacheKey) {
        String cachedValue;
        try {
            cachedValue = redisTemplate.opsForValue().get(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis read failed for weather cache key {}", cacheKey, exception);
            return null;
        }
        if (cachedValue == null || cachedValue.isBlank()) {
            return null;
        }
        try {
            List<SpaceWeatherEvent> events = objectMapper.readValue(cachedValue, new TypeReference<>() {
            });
            if (events.isEmpty()) {
                safeDeleteCacheKey(cacheKey);
                return null;
            }
            return events;
        } catch (JsonProcessingException exception) {
            safeDeleteCacheKey(cacheKey);
            return null;
        }
    }

    private void writeToCache(String cacheKey, List<SpaceWeatherEvent> events) {
        if (events.isEmpty()) {
            safeDeleteCacheKey(cacheKey);
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(events);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Failed to serialize weather events for cache key {}", cacheKey, exception);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis write failed for weather cache key {}", cacheKey, exception);
        }
    }

    private void safeDeleteCacheKey(String cacheKey) {
        try {
            redisTemplate.delete(cacheKey);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis delete failed for weather cache key {}", cacheKey, exception);
        }
    }

    private String buildCacheKey(LocalDate date, int days) {
        return "weather:events:" + date + ":" + days;
    }
}
