package com.space.visualiser_api.controller;

import com.space.visualiser_api.service.AiExplanationService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/ai")
public class AiExplanationController {

    private static final long REQUESTS_PER_MINUTE = 100L;

    private final AiExplanationService aiExplanationService;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    public AiExplanationController(AiExplanationService aiExplanationService, org.springframework.data.redis.core.StringRedisTemplate redisTemplate) {
        this.aiExplanationService = aiExplanationService;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/explain")
    public Map<String, String> explain(
            @RequestParam String type,
            @RequestParam String id,
            HttpServletRequest request
    ) {
        enforceRateLimit(request);

        String explanation = aiExplanationService.explain(type, id);
        return Map.of("explanation", explanation);
    }

    private void enforceRateLimit(HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        String key = "ratelimit:ai:" + clientIp;
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redisTemplate.expire(key, Duration.ofMinutes(1));
            }
            if (count != null && count > REQUESTS_PER_MINUTE) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
            }
        } catch (Exception e) {
            // Redis might be down, fallback to allow or log
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
