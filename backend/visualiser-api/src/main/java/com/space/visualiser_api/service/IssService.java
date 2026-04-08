package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.controller.dto.IssPositionDto;
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
        String cached = readFromCache();
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, IssPositionDto.class);
            } catch (JsonProcessingException e) {
                redisTemplate.delete(CACHE_KEY);
            }
        }

        IssPositionDto position = fetchFromExternal();
        if (position != null) {
            writeToCache(position);
        }
        return position;
    }

    private String readFromCache() {
        try {
            return redisTemplate.opsForValue().get(CACHE_KEY);
        } catch (Exception e) {
            LOGGER.warn("Redis read failed for ISS position", e);
            return null;
        }
    }

    private void writeToCache(IssPositionDto position) {
        try {
            String payload = objectMapper.writeValueAsString(position);
            redisTemplate.opsForValue().set(CACHE_KEY, payload, CACHE_TTL);
        } catch (Exception e) {
            LOGGER.warn("Redis write failed for ISS position", e);
        }
    }

    private IssPositionDto fetchFromExternal() {
        try {
            return issWebClient.get()
                    .uri("/satellites/25544")
                    .retrieve()
                    .bodyToMono(IssPositionDto.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
        } catch (Exception e) {
            LOGGER.error("Failed to fetch ISS position from external API", e);
            // Fallback to a safe "telemetry lost" state if needed, but for now we return null
            // and let the controller handle it.
            return null;
        }
    }
}
