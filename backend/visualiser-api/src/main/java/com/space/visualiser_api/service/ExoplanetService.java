package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.Exoplanet;
import com.space.visualiser_api.repository.ExoplanetRepository;
import com.space.visualiser_api.visualiser.dto.ExoplanetDetailDto;
import com.space.visualiser_api.visualiser.dto.ExoplanetSummaryDto;
import io.micrometer.core.instrument.Counter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;

@Service
public class ExoplanetService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExoplanetService.class);
    private static final String CACHE_ALL = "exoplanets:all";
    private static final String CACHE_DETAIL_PREFIX = "exoplanets:detail:";

    private final ExoplanetRepository exoplanetRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration cacheTtl;
    private final Counter cacheHitsCounter;
    private final Counter cacheMissesCounter;

    public ExoplanetService(
            ExoplanetRepository exoplanetRepository,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper,
            @Qualifier("spaceCacheHitsCounter") Counter cacheHitsCounter,
            @Qualifier("spaceCacheMissesCounter") Counter cacheMissesCounter,
            @Value("${app.exoplanets.cache-ttl:PT12H}") Duration cacheTtl
    ) {
        this.exoplanetRepository = exoplanetRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.cacheHitsCounter = cacheHitsCounter;
        this.cacheMissesCounter = cacheMissesCounter;
        this.cacheTtl = cacheTtl;
    }

    public List<ExoplanetSummaryDto> getAll() {
        String cached = safeRedisGet(CACHE_ALL);
        if (cached != null) {
            try {
                LOGGER.debug("Cache HIT for key {}", CACHE_ALL);
                cacheHitsCounter.increment();
                return objectMapper.readValue(cached, new TypeReference<List<ExoplanetSummaryDto>>() {});
            } catch (JsonProcessingException exception) {
                safeRedisDelete(CACHE_ALL);
            }
        }
        LOGGER.debug("Cache MISS for key {}", CACHE_ALL);
        cacheMissesCounter.increment();

        List<ExoplanetSummaryDto> summaries = exoplanetRepository.findAll()
                .stream()
                .map(this::toSummary)
                .toList();

        safeRedisSet(CACHE_ALL, summaries);
        return summaries;
    }

    public ExoplanetDetailDto getDetail(String plName) {
        String cacheKey = CACHE_DETAIL_PREFIX + plName;
        String cached = safeRedisGet(cacheKey);
        if (cached != null) {
            try {
                LOGGER.debug("Cache HIT for key {}", cacheKey);
                cacheHitsCounter.increment();
                return objectMapper.readValue(cached, ExoplanetDetailDto.class);
            } catch (JsonProcessingException exception) {
                safeRedisDelete(cacheKey);
            }
        }
        LOGGER.debug("Cache MISS for key {}", cacheKey);
        cacheMissesCounter.increment();

        Exoplanet planet = exoplanetRepository.findById(plName)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Exoplanet not found: " + plName
                ));

        ExoplanetDetailDto detail = toDetail(planet);
        safeRedisSet(cacheKey, detail);
        return detail;
    }

    private ExoplanetSummaryDto toSummary(Exoplanet planet) {
        ExoplanetSummaryDto dto = new ExoplanetSummaryDto();
        dto.setPlName(planet.getPlName());
        dto.setPlOrbper(planet.getPlOrbper());
        dto.setPlRade(planet.getPlRade());
        dto.setDiscoverymethod(planet.getDiscoverymethod());
        dto.setDiscYear(planet.getDiscYear());
        return dto;
    }

    private ExoplanetDetailDto toDetail(Exoplanet planet) {
        ExoplanetDetailDto dto = new ExoplanetDetailDto();
        dto.setPlName(planet.getPlName());
        dto.setHostname(planet.getHostname());
        dto.setPlOrbper(planet.getPlOrbper());
        dto.setPlRade(planet.getPlRade());
        dto.setPlMasse(planet.getPlMasse());
        dto.setDiscoverymethod(planet.getDiscoverymethod());
        dto.setDiscYear(planet.getDiscYear());
        dto.setStTeff(planet.getStTeff());
        return dto;
    }

    private String safeRedisGet(String key) {
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis read failed for key {}", key, exception);
            return null;
        }
    }

    private void safeRedisSet(String key, Object value) {
        try {
            String payload = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(key, payload, cacheTtl);
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Failed to serialize value for cache key {}", key, exception);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis write failed for key {}", key, exception);
        }
    }

    private void safeRedisDelete(String key) {
        try {
            redisTemplate.delete(key);
        } catch (RuntimeException exception) {
            LOGGER.warn("Redis delete failed for key {}", key, exception);
        }
    }
}
