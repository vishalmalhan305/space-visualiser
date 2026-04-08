package com.space.visualiser_api.controller;

import com.space.visualiser_api.entity.MarsPhoto;
import com.space.visualiser_api.service.MarsService;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/mars")
@Validated
public class MarsController {

    private static final long REQUESTS_PER_MINUTE = 100L;
    private static final Map<String, Bucket> RATE_LIMIT_BUCKETS = new ConcurrentHashMap<>();

    private final MarsService marsService;

    public MarsController(MarsService marsService) {
        this.marsService = marsService;
    }

    @GetMapping("/photos")
    public List<MarsPhoto> getPhotos(
            @RequestParam @NotBlank String rover,
            @RequestParam(required = false) String camera,
            @RequestParam @Min(0) @Max(10000) Integer sol,
            HttpServletRequest request
    ) {
        enforceRateLimit(request);
        return marsService.getPhotos(rover, camera, sol);
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
