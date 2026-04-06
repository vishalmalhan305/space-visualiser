package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.repository.AsteroidRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class AsteroidService {

    private final AsteroidRepository asteroidRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration cacheTtl;

    public AsteroidService(
            AsteroidRepository asteroidRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${app.asteroids.cache-ttl:PT6H}") Duration cacheTtl
    ) {
        this.asteroidRepository = asteroidRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.cacheTtl = cacheTtl;
    }

    public List<Asteroid> getCurrentWeek() {
        LocalDate startDate = LocalDate.now(ZoneOffset.UTC);
        return getByDateRange(startDate, startDate.plusDays(6));
    }

    public List<Asteroid> getByDateRange(LocalDate startDate, LocalDate endDate) {
        String cacheKey = buildCacheKey(startDate, endDate);
        List<Asteroid> cachedAsteroids = readFromCache(cacheKey);
        if (cachedAsteroids != null) {
            return cachedAsteroids;
        }

        List<Asteroid> asteroids = asteroidRepository
                .findByCloseApproachDateBetweenOrderByCloseApproachDateAsc(startDate, endDate);
        if (asteroids.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Asteroids not found for range " + startDate + " to " + endDate
            );
        }

        writeToCache(cacheKey, asteroids);
        return asteroids;
    }

    private List<Asteroid> readFromCache(String cacheKey) {
        String cachedValue = redisTemplate.opsForValue().get(cacheKey);
        if (cachedValue == null || cachedValue.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(cachedValue, new TypeReference<>() {
            });
        } catch (JsonProcessingException exception) {
            redisTemplate.delete(cacheKey);
            return null;
        }
    }

    private void writeToCache(String cacheKey, List<Asteroid> asteroids) {
        try {
            String payload = objectMapper.writeValueAsString(asteroids);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize asteroid list for cache", exception);
        }
    }

    private String buildCacheKey(LocalDate startDate, LocalDate endDate) {
        return "asteroids:" + startDate + ":" + endDate;
    }
}
