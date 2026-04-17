package com.space.visualiser_api.controller;

import com.space.visualiser_api.service.AiExplanationService;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
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
    private static final Map<String, Bucket> RATE_LIMIT_BUCKETS = new ConcurrentHashMap<>();

    private final AiExplanationService aiExplanationService;

    public AiExplanationController(AiExplanationService aiExplanationService) {
        this.aiExplanationService = aiExplanationService;
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
        Bucket bucket = RATE_LIMIT_BUCKETS.computeIfAbsent(clientIp, ignored -> createBucket());
        if (!bucket.tryConsume(1)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
        }
    }

    private Bucket createBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(REQUESTS_PER_MINUTE)
                .refillIntervally(REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
