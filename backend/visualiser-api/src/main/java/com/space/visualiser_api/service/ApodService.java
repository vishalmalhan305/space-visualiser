package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.ApodEntry;
import com.space.visualiser_api.repository.ApodRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@Service
public class ApodService {

    private final ApodRepository apodRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration cacheTtl;

    public ApodService(
            ApodRepository apodRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Value("${app.apod.cache-ttl:PT24H}") Duration cacheTtl
    ) {
        this.apodRepository = apodRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.cacheTtl = cacheTtl;
    }

    public ApodEntry getToday() {
        return getByDate(LocalDate.now(ZoneOffset.UTC));
    }

    public List<ApodEntry> getArchive(int count) {
        String cacheKey = "apod:archive:" + count;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null && !cached.isBlank()) {
            try {
                return objectMapper.readValue(cached, new TypeReference<List<ApodEntry>>() {});
            } catch (JsonProcessingException e) {
                redisTemplate.delete(cacheKey);
            }
        }

        PageRequest page = PageRequest.of(0, count, Sort.by(Sort.Direction.DESC, "date"));
        List<ApodEntry> entries = apodRepository.findAll(page).getContent();

        try {
            String payload = objectMapper.writeValueAsString(entries);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException e) {
            // Cache write failure is non-fatal
        }

        return entries;
    }

    public ApodEntry getByDate(LocalDate date) {
        String cacheKey = buildCacheKey(date);
        ApodEntry cachedEntry = readFromCache(cacheKey);
        if (cachedEntry != null) {
            return cachedEntry;
        }

        ApodEntry apodEntry = apodRepository.findById(date)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "APOD entry not found for date " + date
                ));

        writeToCache(cacheKey, apodEntry);
        return apodEntry;
    }

    private ApodEntry readFromCache(String cacheKey) {
        String cachedValue = redisTemplate.opsForValue().get(cacheKey);
        if (cachedValue == null || cachedValue.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readValue(cachedValue, ApodEntry.class);
        } catch (JsonProcessingException exception) {
            redisTemplate.delete(cacheKey);
            return null;
        }
    }

    private void writeToCache(String cacheKey, ApodEntry apodEntry) {
        try {
            String payload = objectMapper.writeValueAsString(apodEntry);
            redisTemplate.opsForValue().set(cacheKey, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize APOD entry for cache", exception);
        }
    }

    private String buildCacheKey(LocalDate date) {
        return "apod:" + date;
    }
}
