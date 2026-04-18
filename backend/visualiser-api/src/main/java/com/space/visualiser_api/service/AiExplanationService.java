package com.space.visualiser_api.service;

import com.space.visualiser_api.entity.AiExplanation;
import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.repository.AiExplanationRepository;
import com.space.visualiser_api.repository.AsteroidRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AiExplanationService {

    private static final String CACHE_KEY_PREFIX = "ai:explain:";
    private static final String FALLBACK_MESSAGE = "Explanation temporarily unavailable. Please try again later.";

    private final WebClient geminiWebClient;
    private final AiExplanationRepository repository;
    private final AsteroidRepository asteroidRepository;
    private final StringRedisTemplate redisTemplate;
    private final String apiKey;
    private final String model;
    private final Duration cacheTtl;

    public AiExplanationService(
            @Qualifier("geminiWebClient") WebClient geminiWebClient,
            AiExplanationRepository repository,
            AsteroidRepository asteroidRepository,
            StringRedisTemplate redisTemplate,
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model:gemini-2.5-flash}") String model,
            @Value("${app.gemini.explanation-cache-ttl:PT24H}") Duration cacheTtl
    ) {
        this.geminiWebClient = geminiWebClient;
        this.asteroidRepository = asteroidRepository;
        this.repository = repository;
        this.redisTemplate = redisTemplate;
        this.apiKey = apiKey;
        this.model = model;
        this.cacheTtl = cacheTtl;
    }

    public String explain(String eventType, String eventId) {
        String cacheKey = CACHE_KEY_PREFIX + eventType + ":" + eventId;

        String cached = readFromCache(cacheKey);
        if (cached != null) {
            log.debug("Cache HIT for key {}", cacheKey);
            return cached;
        }

        log.debug("Cache MISS for key {}", cacheKey);
        String prompt = buildPrompt(eventType, eventId);
        String promptHash = sha256(prompt);

        String explanation = callGeminiApi(prompt);
        if (explanation == null) {
            return FALLBACK_MESSAGE;
        }

        persistAuditRecord(eventType, eventId, promptHash, explanation, 0);
        writeToCache(cacheKey, explanation);

        return explanation;
    }

    private String readFromCache(String cacheKey) {
        try {
            String value = redisTemplate.opsForValue().get(cacheKey);
            if (value != null && !value.isBlank()) {
                return value;
            }
        } catch (RuntimeException ex) {
            log.warn("Redis read failed for key {}", cacheKey, ex);
        }
        return null;
    }

    private void writeToCache(String cacheKey, String explanation) {
        try {
            redisTemplate.opsForValue().set(cacheKey, explanation, cacheTtl);
        } catch (RuntimeException ex) {
            log.warn("Redis write failed for key {}", cacheKey, ex);
        }
    }

    private String callGeminiApi(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key is not configured — skipping external call");
            return null;
        }

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                )
        );

        try {
            Map<?, ?> response = geminiWebClient.post()
                    .uri("/{model}:generateContent?key={key}", model, apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .retryWhen(Retry.backoff(3, Duration.ofSeconds(5))
                            .maxBackoff(Duration.ofSeconds(30))
                            .jitter(0.5)
                            .filter(t -> t instanceof WebClientResponseException ex
                                    && (ex.getStatusCode().value() == 429
                                            || ex.getStatusCode().value() >= 500)))
                    .block();

            return extractText(response);
        } catch (WebClientResponseException ex) {
            log.error("Gemini API returned HTTP {} for prompt", ex.getStatusCode(), ex);
        } catch (RuntimeException ex) {
            log.error("Gemini API call failed", ex);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<?, ?> response) {
        if (response == null) {
            return null;
        }
        try {
            List<?> candidates = (List<?>) response.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return null;
            }
            Map<?, ?> content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
            List<?> parts = (List<?>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                return null;
            }
            return (String) ((Map<?, ?>) parts.get(0)).get("text");
        } catch (ClassCastException ex) {
            log.warn("Unexpected Gemini response structure", ex);
            return null;
        }
    }

    private void persistAuditRecord(String eventType, String eventId, String promptHash,
                                    String explanation, int tokensUsed) {
        try {
            AiExplanation record = new AiExplanation();
            record.setEventType(eventType);
            record.setEventId(eventId);
            record.setPromptHash(promptHash);
            record.setExplanationText(explanation);
            record.setTokensUsed(tokensUsed);
            record.setCreatedAt(LocalDateTime.now());
            repository.save(record);
        } catch (RuntimeException ex) {
            log.error("Failed to persist AI explanation audit record for {}/{}", eventType, eventId, ex);
        }
    }

    private String buildPrompt(String eventType, String eventId) {
        if ("asteroid".equalsIgnoreCase(eventType)) {
            return asteroidRepository.findFirstByNeoId(eventId)
                    .map(this::buildAsteroidPrompt)
                    .orElseGet(() -> buildGenericPrompt(eventType, eventId));
        }
        return buildGenericPrompt(eventType, eventId);
    }

    private String buildAsteroidPrompt(Asteroid a) {
        return String.format(
                "You are a science communicator explaining near-Earth objects to the public. "
                + "Explain the following asteroid in plain English in 2-3 engaging sentences. "
                + "Focus on its name, size, and whether it poses any threat. "
                + "Name: %s (NASA ID: %s). "
                + "Estimated diameter: %.3f–%.3f km. "
                + "Closest approach: %s at %.2f million km. "
                + "Velocity: %.0f km/h. "
                + "Potentially hazardous: %s.",
                a.getName(), a.getNeoId(),
                a.getEstDiameterKmMin(), a.getEstDiameterKmMax(),
                a.getCloseApproachDate(), a.getMissDistanceKm() / 1_000_000.0,
                a.getVelocity_kmh(),
                a.isPotentiallyHazardous() ? "yes" : "no"
        );
    }

    private String buildGenericPrompt(String eventType, String eventId) {
        return String.format(
                "You are a science communicator explaining space events to the public. "
                + "Explain the following space event in plain English in 2-3 sentences. "
                + "Event type: %s. Event ID: %s.",
                eventType, eventId
        );
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
