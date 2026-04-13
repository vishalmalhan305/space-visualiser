package com.space.visualiser_api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.repository.AsteroidRepository;
import com.space.visualiser_api.visualiser.ingestion.NeoWsIngestionJob;
import io.micrometer.core.instrument.Counter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

    private AsteroidService asteroidService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        asteroidService = new AsteroidService(
                asteroidRepository,
                neoWsIngestionJob,
                redisTemplate,
                objectMapper,
                cacheHitsCounter,
                cacheMissesCounter,
                Duration.ofHours(6)
        );
    }

    @Test
    void getAsteroidsPage_ReturnsPageFromRepository() {
        // Arrange
        PageRequest pageRequest = PageRequest.of(0, 10);
        List<Asteroid> content = List.of(new Asteroid());
        Page<Asteroid> expectedPage = new PageImpl<>(content);

        when(asteroidRepository.findAll(any(PageRequest.class))).thenReturn(expectedPage);

        // Act
        Page<Asteroid> result = asteroidService.getAsteroidsPage(null, 0, 10);

        // Assert
        assertEquals(expectedPage, result);
        verify(asteroidRepository).findAll(any(PageRequest.class));
    }

    @Test
    void getAsteroidsPage_HazardousFiltered_ReturnsFilteredPage() {
        // Arrange
        PageRequest pageRequest = PageRequest.of(0, 10);
        List<Asteroid> content = List.of(new Asteroid());
        Page<Asteroid> expectedPage = new PageImpl<>(content);

        when(asteroidRepository.findByPotentiallyHazardous(eq(true), any(PageRequest.class))).thenReturn(expectedPage);

        // Act
        Page<Asteroid> result = asteroidService.getAsteroidsPage(true, 0, 10);

        // Assert
        assertEquals(expectedPage, result);
        verify(asteroidRepository).findByPotentiallyHazardous(eq(true), any(PageRequest.class));
    }
}
