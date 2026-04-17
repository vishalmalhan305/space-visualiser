package com.space.visualiser_api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.SpaceWeatherEvent;
import com.space.visualiser_api.entity.SpaceWeatherEventType;
import com.space.visualiser_api.repository.SpaceWeatherEventRepository;
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
class SpaceWeatherServiceTest {

    @Mock
    private SpaceWeatherEventRepository repository;
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

    private SpaceWeatherService service;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new SpaceWeatherService(
                repository,
                redisTemplate,
                objectMapper,
                cacheHitsCounter,
                cacheMissesCounter,
                Duration.ofHours(6)
        );
    }

    @Test
    void getWeatherPage_WithNoType_ReturnsAllPage() {
        // Arrange
        Page<SpaceWeatherEvent> expectedPage = new PageImpl<>(List.of(new SpaceWeatherEvent()));
        when(repository.findAll(any(PageRequest.class))).thenReturn(expectedPage);

        // Act
        Page<SpaceWeatherEvent> result = service.getWeatherPage(null, 0, 10);

        // Assert
        assertEquals(expectedPage, result);
        verify(repository).findAll(any(PageRequest.class));
    }

    @Test
    void getWeatherPage_WithType_ReturnsFilteredPage() {
        // Arrange
        Page<SpaceWeatherEvent> expectedPage = new PageImpl<>(List.of(new SpaceWeatherEvent()));
        when(repository.findByType(eq(SpaceWeatherEventType.FLARE), any(PageRequest.class))).thenReturn(expectedPage);

        // Act
        Page<SpaceWeatherEvent> result = service.getWeatherPage(SpaceWeatherEventType.FLARE, 0, 10);

        // Assert
        assertEquals(expectedPage, result);
        verify(repository).findByType(eq(SpaceWeatherEventType.FLARE), any(PageRequest.class));
    }
}
