package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.visualiser.dto.IssPositionDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
public class IssService {

    private static final Logger LOGGER = LoggerFactory.getLogger(IssService.class);
    private static final String CACHE_KEY = "iss:position";
    private static final Duration CACHE_TTL = Duration.ofSeconds(10);

    private final WebClient issWebClient;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public IssService(
            @Qualifier("issWebClient") WebClient issWebClient,
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper
    ) {
        this.issWebClient = issWebClient;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public IssPositionDto getCurrentPosition() {
        // 1. Always try to get fresh data first
        IssPositionDto freshPosition = fetchFromExternal();

        if (freshPosition != null) {
            writeToCache(freshPosition);
            return freshPosition;
        }

        // 2. If fresh fetch failed, attempt to return STALE data from cache
        LOGGER.info("Fresh fetch failed. Attempting to retrieve stale position from cache...");
        String cached = readFromCache();
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, IssPositionDto.class);
            } catch (JsonProcessingException e) {
                LOGGER.error("Failed to parse stale cache data");
            }
        }

        // 3. Absolute fallback if even the cache is empty
        return null;
    }

    private String readFromCache() {
        try {
            return redisTemplate.opsForValue().get(CACHE_KEY);
        } catch (Exception e) {
            LOGGER.warn("Redis read failed: falling back to live fetch", e);
            return null;
        }
    }

    private void writeToCache(IssPositionDto position) {
        try {
            String payload = objectMapper.writeValueAsString(position);
            redisTemplate.opsForValue().set(CACHE_KEY, payload, CACHE_TTL);
        } catch (Exception e) {
            LOGGER.warn("Failed to update Redis cache", e);
        }
    }

    private IssPositionDto fetchFromExternal() {
        try {
            return issWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/satellites/25544")
                            .queryParam("units", "kilometers")
                            .build())
                    .retrieve()
                    .bodyToMono(IssPositionDto.class)
                    // Increase timeout since Postman confirmed the API is slow (8s+)
                    .timeout(Duration.ofSeconds(15))
                    .onErrorResume(e -> {
                        LOGGER.error("ISS API slow or down: {}", e.getMessage());
                        return Mono.empty();
                    })
                    .block();
        } catch (Exception e) {
            return null;
        }
    }
}