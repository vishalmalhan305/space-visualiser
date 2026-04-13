package com.space.visualiser_api.controller;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.space.visualiser_api.visualiser.dto.MonthlyWeatherStatsDto;
import com.space.visualiser_api.entity.SpaceWeatherEvent;
import com.space.visualiser_api.entity.SpaceWeatherEventType;
import com.space.visualiser_api.service.SpaceWeatherService;
import org.springframework.data.domain.Page;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/weather")
@Validated
public class SpaceWeatherController {

    private static final long REQUESTS_PER_MINUTE = 100L;
    private static final Map<String, Bucket> RATE_LIMIT_BUCKETS = new ConcurrentHashMap<>();

    private final SpaceWeatherService service;

    public SpaceWeatherController(SpaceWeatherService service) {
        this.service = service;
    }

    @GetMapping("/recent")
    public List<SpaceWeatherEvent> getRecent(
            @RequestParam(defaultValue = "7") @Min(1) @Max(90) int days,
            HttpServletRequest request
    ) {
        enforceRateLimit(request);
        return service.getRecentEvents(days);
    }

    @GetMapping("/stats/monthly")
    public List<MonthlyWeatherStatsDto> getMonthlyStats(HttpServletRequest request) {
        enforceRateLimit(request);
        return service.getMonthlyStats();
    }

    @GetMapping("/page")
    public Page<SpaceWeatherEvent> getPage(
            @RequestParam(required = false) SpaceWeatherEventType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        enforceRateLimit(request);
        return service.getWeatherPage(type, page, size);
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
                .refillGreedy(REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
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
