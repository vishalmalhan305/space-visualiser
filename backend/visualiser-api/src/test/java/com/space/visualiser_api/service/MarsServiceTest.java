package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.MarsPhoto;
import com.space.visualiser_api.repository.MarsPhotoRepository;
import com.space.visualiser_api.visualiser.dto.NasaMarsPhotoResponseDto;
import io.micrometer.core.instrument.Counter;
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
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarsServiceTest {

    @Mock
    private MarsPhotoRepository marsPhotoRepository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private WebClient nasaWebClient;
    @Mock
    private Counter cacheHitsCounter;
    @Mock
    private Counter cacheMissesCounter;

    @Mock
    private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock
    private WebClient.ResponseSpec responseSpec;

    private MarsService marsService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        marsService = new MarsService(
                marsPhotoRepository,
                redisTemplate,
                objectMapper,
                nasaWebClient,
                "TEST_KEY",
                cacheHitsCounter,
                cacheMissesCounter,
                Duration.ofDays(7)
        );
    }

    @Test
    void getPhotos_CacheHit_ReturnsCachedList() throws JsonProcessingException {
        // Arrange
        String rover = "curiosity";
        String camera = "FHAZ";
        Integer sol = 1000;
        String cacheKey = "mars:photos:curiosity:fhaz:sol:1000";
        String cachedJson = "[{\"photoId\":123}]";
        List<MarsPhoto> expectedPhotos = List.of(new MarsPhoto());

        when(valueOperations.get(cacheKey)).thenReturn(cachedJson);
        when(objectMapper.readValue(eq(cachedJson), any(TypeReference.class))).thenReturn(expectedPhotos);

        // Act
        List<MarsPhoto> result = marsService.getPhotos(rover, camera, sol);

        // Assert
        assertEquals(expectedPhotos, result);
        verify(cacheHitsCounter).increment();
        verifyNoInteractions(marsPhotoRepository, nasaWebClient);
    }

    @Test
    void getPhotos_CacheMiss_DbHit_ReturnsDbListAndCaches() throws JsonProcessingException {
        // Arrange
        String rover = "curiosity";
        String camera = "FHAZ";
        Integer sol = 1000;
        String cacheKey = "mars:photos:curiosity:fhaz:sol:1000";
        List<MarsPhoto> dbPhotos = List.of(new MarsPhoto());

        when(valueOperations.get(cacheKey)).thenReturn(null);
        when(marsPhotoRepository.findByRoverAndCameraAndSol("curiosity", "fhaz", 1000)).thenReturn(dbPhotos);
        when(objectMapper.writeValueAsString(dbPhotos)).thenReturn("[]");

        // Act
        List<MarsPhoto> result = marsService.getPhotos(rover, camera, sol);

        // Assert
        assertEquals(dbPhotos, result);
        verify(cacheMissesCounter).increment();
        verify(valueOperations).set(eq(cacheKey), anyString(), eq(Duration.ofDays(7)));
        verifyNoInteractions(nasaWebClient);
    }

    @Test
    void getPhotos_CacheMiss_DbMiss_ApiFetchSuccess() throws JsonProcessingException {
        // Arrange
        String rover = "curiosity";
        String camera = "FHAZ";
        Integer sol = 1000;
        String cacheKey = "mars:photos:curiosity:fhaz:sol:1000";

        when(valueOperations.get(cacheKey)).thenReturn(null);
        when(marsPhotoRepository.findByRoverAndCameraAndSol(anyString(), anyString(), anyInt())).thenReturn(Collections.emptyList());

        // Mock WebClient chain
        when(nasaWebClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        
        NasaMarsPhotoResponseDto responseDto = new NasaMarsPhotoResponseDto();
        NasaMarsPhotoResponseDto.NasaMarsPhotoDto photoDto = new NasaMarsPhotoResponseDto.NasaMarsPhotoDto();
        photoDto.setId(999L);
        photoDto.setImgSrc("http://mars.com/img.jpg");
        photoDto.setEarthDate("2021-01-01");
        NasaMarsPhotoResponseDto.CameraDto cameraDto = new NasaMarsPhotoResponseDto.CameraDto();
        cameraDto.setName("FHAZ");
        photoDto.setCamera(cameraDto);
        responseDto.setPhotos(List.of(photoDto));

        when(responseSpec.bodyToMono(NasaMarsPhotoResponseDto.class)).thenReturn(Mono.just(responseDto));
        when(objectMapper.writeValueAsString(anyList())).thenReturn("[]");

        // Act
        List<MarsPhoto> result = marsService.getPhotos(rover, camera, sol);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(999L, result.get(0).getPhotoId());
        verify(marsPhotoRepository).saveAll(any());
        verify(valueOperations).set(eq(cacheKey), anyString(), any(Duration.class));
    }
}
