package com.space.visualiser_api.service;

import com.space.visualiser_api.entity.AiExplanation;
import com.space.visualiser_api.entity.Exoplanet;
import com.space.visualiser_api.repository.AiExplanationRepository;
import com.space.visualiser_api.repository.ApodRepository;
import com.space.visualiser_api.repository.AsteroidRepository;
import com.space.visualiser_api.repository.ExoplanetRepository;
import com.space.visualiser_api.repository.MarsPhotoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SuppressWarnings({"unchecked", "rawtypes"})
@ExtendWith(MockitoExtension.class)
class AiExplanationServiceTest {

    @Mock
    private WebClient geminiWebClient;
    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock
    private WebClient.RequestBodySpec requestBodySpec;
    @Mock
    private WebClient.ResponseSpec responseSpec;
    @Mock
    private AsteroidRepository asteroidRepository;
    @Mock
    private ApodRepository apodRepository;
    @Mock
    private MarsPhotoRepository marsPhotoRepository;
    @Mock
    private ExoplanetRepository exoplanetRepository;
    @Mock
    private AiExplanationRepository repository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    private AiExplanationService service;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new AiExplanationService(
                geminiWebClient,
                repository,
                asteroidRepository,
                apodRepository,
                marsPhotoRepository,
                exoplanetRepository,
                redisTemplate,
                "test-api-key",
                "gemini-2.5-flash",
                Duration.ofHours(24)
        );
    }

    @Test
    void returnsExplanationFromCacheOnCacheHit() {
        when(valueOperations.get("ai:explain:FLARE:123")).thenReturn("Cached explanation.");

        String result = service.explain("FLARE", "123");

        assertThat(result).isEqualTo("Cached explanation.");
        verifyNoInteractions(geminiWebClient, repository);
    }

    @Test
    void callsGeminiAndPersistsOnCacheMiss() {
        when(valueOperations.get("ai:explain:FLARE:456")).thenReturn(null);

        Map<String, Object> geminiResponse = Map.of(
                "candidates", List.of(
                        Map.of("content", Map.of(
                                "parts", List.of(Map.of("text", "A solar flare is a burst of energy from the sun.")),
                                "role", "model"
                        ))
                )
        );

        when(geminiWebClient.post()).thenReturn(requestBodyUriSpec);
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(anyString(), anyString(), anyString());
        doReturn(requestBodySpec).when(requestBodySpec).bodyValue(any());
        doReturn(responseSpec).when(requestBodySpec).retrieve();
        doReturn(Mono.just(geminiResponse)).when(responseSpec).bodyToMono(Map.class);

        String result = service.explain("FLARE", "456");

        assertThat(result).isEqualTo("A solar flare is a burst of energy from the sun.");

        ArgumentCaptor<AiExplanation> captor = ArgumentCaptor.forClass(AiExplanation.class);
        verify(repository).save(captor.capture());
        AiExplanation saved = captor.getValue();
        assertThat(saved.getEventType()).isEqualTo("FLARE");
        assertThat(saved.getEventId()).isEqualTo("456");
        assertThat(saved.getExplanationText()).isEqualTo("A solar flare is a burst of energy from the sun.");
        assertThat(saved.getPromptHash()).hasSize(64);

        verify(valueOperations).set(
                eq("ai:explain:FLARE:456"),
                eq("A solar flare is a burst of energy from the sun."),
                eq(Duration.ofHours(24)));
    }

    @Test
    void returnsFallbackMessageWhenApiKeyIsBlank() {
        service = new AiExplanationService(
                geminiWebClient, repository, asteroidRepository, apodRepository,
                marsPhotoRepository, exoplanetRepository, redisTemplate, "", "gemini-2.5-flash",
                Duration.ofHours(24));

        when(valueOperations.get("ai:explain:CME:789")).thenReturn(null);

        String result = service.explain("CME", "789");

        assertThat(result).isEqualTo("Explanation temporarily unavailable. Please try again later.");
        verifyNoInteractions(repository);
        verify(valueOperations, never()).set(anyString(), anyString(), any(Duration.class));
    }

    @Test
    void returnsFallbackMessageWhenGeminiApiThrows() {
        when(valueOperations.get("ai:explain:FLARE:999")).thenReturn(null);

        when(geminiWebClient.post()).thenReturn(requestBodyUriSpec);
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(anyString(), anyString(), anyString());
        doReturn(requestBodySpec).when(requestBodySpec).bodyValue(any());
        doReturn(responseSpec).when(requestBodySpec).retrieve();
        doReturn(Mono.error(new RuntimeException("Network error"))).when(responseSpec).bodyToMono(Map.class);

        String result = service.explain("FLARE", "999");

        assertThat(result).isEqualTo("Explanation temporarily unavailable. Please try again later.");
        verifyNoInteractions(repository);
    }

    @Test
    void buildsExoplanetPromptAndCallsGemini() {
        Exoplanet planet = new Exoplanet();
        planet.setPlName("Kepler-442b");
        planet.setHostname("Kepler-442");
        planet.setPlOrbper(112.3);
        planet.setPlRade(1.34);
        planet.setDiscYear(2015);
        planet.setDiscoverymethod("Transit");
        planet.setStTeff(4402.0);

        when(valueOperations.get("ai:explain:exoplanet:Kepler-442b")).thenReturn(null);
        when(exoplanetRepository.findById("Kepler-442b")).thenReturn(Optional.of(planet));

        Map<String, Object> geminiResponse = Map.of(
                "candidates", List.of(Map.of("content", Map.of(
                        "parts", List.of(Map.of("text", "Kepler-442b is a super-Earth.")),
                        "role", "model")))
        );
        when(geminiWebClient.post()).thenReturn(requestBodyUriSpec);
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(anyString(), anyString(), anyString());
        doReturn(requestBodySpec).when(requestBodySpec).bodyValue(any());
        doReturn(responseSpec).when(requestBodySpec).retrieve();
        doReturn(Mono.just(geminiResponse)).when(responseSpec).bodyToMono(Map.class);

        String result = service.explain("exoplanet", "Kepler-442b");

        assertThat(result).isEqualTo("Kepler-442b is a super-Earth.");
    }
}
