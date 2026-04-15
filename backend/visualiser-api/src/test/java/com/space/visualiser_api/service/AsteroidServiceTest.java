package com.space.visualiser_api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.repository.AsteroidRepository;
import com.space.visualiser_api.visualiser.ingestion.NeoWsIngestionJob;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AsteroidServiceTest {

    @Mock
    private AsteroidRepository asteroidRepository;
    @Mock
    private NeoWsIngestionJob neoWsIngestionJob;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private Counter cacheHitsCounter;
    @Mock
    private Counter cacheMissesCounter;
    @Mock
    private WebClient nasaWebClient;
    // Real Timer from a simple in-memory registry — avoids generic overload
    // resolution issues when mocking Timer.record(Callable<T>)
    private Timer asteroidQueryTimer;

    private AsteroidService asteroidService;

    @BeforeEach
    void setUp() throws Exception {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        asteroidQueryTimer = Timer.builder("asteroid.query.latency")
                .register(new SimpleMeterRegistry());

        asteroidService = new AsteroidService(
                asteroidRepository,
                neoWsIngestionJob,
                redisTemplate,
                objectMapper,
                cacheHitsCounter,
                cacheMissesCounter,
                asteroidQueryTimer,
                nasaWebClient,
                "TEST_KEY",
                Duration.ofHours(6)
        );
    }

    @Test
    void getAsteroidsPage_ReturnsPageFromRepository() {
        // Arrange
        List<Asteroid> content = List.of(new Asteroid());
        Page<Asteroid> expectedPage = new PageImpl<>(content);

        when(asteroidRepository.findWithFilters(isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(expectedPage);

        // Act
        Page<Asteroid> result = asteroidService.getAsteroidsPage(null, null, null, "closeApproachDate", "DESC", 0, 10);

        // Assert
        assertEquals(expectedPage, result);
        verify(asteroidRepository).findWithFilters(isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void getAsteroidsPage_HazardousFiltered_ReturnsFilteredPage() {
        // Arrange
        List<Asteroid> content = List.of(new Asteroid());
        Page<Asteroid> expectedPage = new PageImpl<>(content);

        when(asteroidRepository.findWithFilters(eq(true), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(expectedPage);

        // Act
        Page<Asteroid> result = asteroidService.getAsteroidsPage(null, null, true, "closeApproachDate", "DESC", 0, 10);

        // Assert
        assertEquals(expectedPage, result);
        verify(asteroidRepository).findWithFilters(eq(true), isNull(), isNull(), any(Pageable.class));
    }
}
