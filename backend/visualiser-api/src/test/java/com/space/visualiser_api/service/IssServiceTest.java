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
    void getCurrentPosition_CacheHit_ReturnsCached() throws JsonProcessingException {
        // Arrange
        String cacheKey = "iss:position";
        String cachedJson = "{\"latitude\": 0.0}";
        IssPositionDto expected = new IssPositionDto();
        
        when(valueOperations.get(cacheKey)).thenReturn(cachedJson);
        when(objectMapper.readValue(cachedJson, IssPositionDto.class)).thenReturn(expected);

        // Act
        IssPositionDto result = issService.getCurrentPosition();

        // Assert
        assertEquals(expected, result);
        verifyNoInteractions(issWebClient);
    }

    @Test
    void getCurrentPosition_CacheMiss_FetchesFromApi() throws JsonProcessingException {
        // Arrange
        String cacheKey = "iss:position";
        IssPositionDto apiResponse = new IssPositionDto();
        apiResponse.setLatitude(10.0);
        apiResponse.setLongitude(20.0);
        apiResponse.setAltitude_km(400.0);
        apiResponse.setVelocity_km_h(28000.0);
        apiResponse.setTimestamp(1600000000L);

        when(valueOperations.get(cacheKey)).thenReturn(null);
        
        // Mock WebClient chain
        when(issWebClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri("/satellites/25544")).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(IssPositionDto.class)).thenReturn(Mono.just(apiResponse));
        
        when(objectMapper.writeValueAsString(apiResponse)).thenReturn("{}");

        // Act
        IssPositionDto result = issService.getCurrentPosition();

        // Assert
        assertNotNull(result);
        assertEquals(10.0, result.getLatitude());
        verify(valueOperations).set(eq(cacheKey), anyString(), any(Duration.class));
    }
}
