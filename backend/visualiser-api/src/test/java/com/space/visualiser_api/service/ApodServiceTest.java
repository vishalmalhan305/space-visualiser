package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.ApodEntry;
import com.space.visualiser_api.repository.ApodRepository;
import io.micrometer.core.instrument.Counter;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApodServiceTest {

    @Mock
    private ApodRepository apodRepository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private Counter cacheHitsCounter;
    @Mock
    private Counter cacheMissesCounter;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private ApodService apodService;

    @Mock
    private com.space.visualiser_api.visualiser.ingestion.ApodIngestionJob apodIngestionJob;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        apodService = new ApodService(
                apodRepository,
                apodIngestionJob,
                redisTemplate,
                objectMapper,
                cacheHitsCounter,
                cacheMissesCounter,
                Duration.ofHours(24)
        );
    }

    @Test
    void getByDate_CacheHit() throws JsonProcessingException {
        LocalDate date = LocalDate.of(2024, 6, 27);
        ApodEntry entry = new ApodEntry();
        entry.setDate(date);
        entry.setTitle("Test Title");

        when(valueOperations.get("apod:" + date)).thenReturn(objectMapper.writeValueAsString(entry));

        ApodEntry result = apodService.getByDate(date);

        assertEquals("Test Title", result.getTitle());
        verify(cacheHitsCounter).increment();
        verifyNoInteractions(apodRepository);
    }

    @Test
    void getByDate_CacheMiss_RepositoryHit() {
        LocalDate date = LocalDate.of(2024, 6, 27);
        ApodEntry entry = new ApodEntry();
        entry.setDate(date);
        entry.setTitle("Repository Title");

        when(valueOperations.get(anyString())).thenReturn(null);
        when(apodRepository.findById(date)).thenReturn(Optional.of(entry));

        ApodEntry result = apodService.getByDate(date);

        assertEquals("Repository Title", result.getTitle());
        verify(cacheMissesCounter).increment();
        verify(valueOperations).set(eq("apod:" + date), anyString(), any(Duration.class));
    }
}
