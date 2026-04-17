package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.visualiser.dto.IssPositionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings({"unchecked", "rawtypes"})
class IssServiceTest {

    @Mock
    private WebClient issWebClient;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock
    private WebClient.ResponseSpec responseSpec;

    private IssService issService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        issService = new IssService(issWebClient, redisTemplate, objectMapper);
    }

    @Test
    void getCurrentPosition_ApiAvailable_ReturnsFreshData() throws JsonProcessingException {
        // Arrange — service always tries live API first
        IssPositionDto apiResponse = new IssPositionDto();
        apiResponse.setLatitude(10.0);
        apiResponse.setLongitude(20.0);
        apiResponse.setAltitude_km(400.0);
        apiResponse.setVelocity_km_h(28000.0);
        apiResponse.setTimestamp(1600000000L);

        when(issWebClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(IssPositionDto.class)).thenReturn(Mono.just(apiResponse));
        when(objectMapper.writeValueAsString(apiResponse)).thenReturn("{}");

        // Act
        IssPositionDto result = issService.getCurrentPosition();

        // Assert
        assertNotNull(result);
        assertEquals(10.0, result.getLatitude());
        verify(valueOperations).set(eq("iss:position"), anyString(), any(Duration.class));
    }

    @Test
    void getCurrentPosition_ApiFails_ReturnsStaleCacheData() throws JsonProcessingException {
        // Arrange — API returns empty, service falls back to stale cache
        String cacheKey = "iss:position";
        String cachedJson = "{\"latitude\":5.0}";
        IssPositionDto staleData = new IssPositionDto();
        staleData.setLatitude(5.0);

        when(issWebClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(IssPositionDto.class)).thenReturn(Mono.empty());

        when(valueOperations.get(cacheKey)).thenReturn(cachedJson);
        when(objectMapper.readValue(cachedJson, IssPositionDto.class)).thenReturn(staleData);

        // Act
        IssPositionDto result = issService.getCurrentPosition();

        // Assert
        assertNotNull(result);
        assertEquals(5.0, result.getLatitude());
        verify(valueOperations, never()).set(anyString(), anyString(), any(Duration.class));
    }

    @Test
    void getCurrentPosition_ApiAndCacheBothFail_ReturnsNull() {
        // Arrange — API fails AND cache is empty
        when(issWebClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(IssPositionDto.class)).thenReturn(Mono.empty());

        when(valueOperations.get("iss:position")).thenReturn(null);

        // Act
        IssPositionDto result = issService.getCurrentPosition();

        // Assert
        assertNull(result);
    }
}
