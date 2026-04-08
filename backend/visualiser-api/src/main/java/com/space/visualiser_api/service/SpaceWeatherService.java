package com.space.visualiser_api.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.SpaceWeatherEvent;
import com.space.visualiser_api.repository.SpaceWeatherEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class SpaceWeatherService {

    private final SpaceWeatherEventRepository repository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration cacheTtl;

    public SpaceWeatherService(
            SpaceWeatherEventRepository repository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${app.weather.cache-ttl:PT6H}") Duration cacheTtl
    ) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.cacheTtl = cacheTtl;
    }

    public List<SpaceWeatherEvent> getRecentEvents(int days) {
        LocalDate todayUtc = LocalDate.now(ZoneOffset.UTC);
        String cacheKey = buildCacheKey(todayUtc, days);
        List<SpaceWeatherEvent> cachedEvents = readFromCache(cacheKey);
        if (cachedEvents != null) {
            return cachedEvents;
        }

        LocalDateTime startTime = todayUtc.atStartOfDay().minusDays(days);
        List<SpaceWeatherEvent> events =
                repository.findByStartTimeGreaterThanEqualOrderByStartTimeDesc(startTime);
        writeToCache(cacheKey, events);
        return events;
    }

    private List<SpaceWeatherEvent> readFromCache(String cacheKey) {
        String cachedValue = redisTemplate.opsForValue().get(cacheKey);
        if (cachedValue == null || cachedValue.isBlank()) {
            return null;
        }
        try {
            List<SpaceWeatherEvent> events = objectMapper.readValue(cachedValue, new TypeReference<>() {
            });
            if (events.isEmpty()) {
                redisTemplate.delete(cacheKey);
                return null;
            }
            return events;
        } catch (JsonProcessingException exception) {
            redisTemplate.delete(cacheKey);
            return null;
        }
    }

    private void writeToCache(String cacheKey, List<SpaceWeatherEvent> events) {
        if (events.isEmpty()) {
            redisTemplate.delete(cacheKey);
            return;
        }
        try {
            String payload = objectMapper.writeValueAsString(events);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(
                    "Failed to serialize weather events for cache",
                    exception
            );
        }
    }

    private String buildCacheKey(LocalDate date, int days) {
        return "weather:events:" + date + ":" + days;
    }
}
