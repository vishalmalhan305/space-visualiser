package com.space.visualiser_api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.space.visualiser_api.entity.MarsPhoto;
import com.space.visualiser_api.repository.MarsPhotoRepository;
import com.space.visualiser_api.visualiser.dto.NasaImageLibraryResponseDto;
import io.micrometer.core.instrument.Counter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings({"unchecked", "rawtypes"})
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
    private WebClient nasaImageWebClient;
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
                nasaImageWebClient,
                cacheHitsCounter,
                cacheMissesCounter,
                Duration.ofDays(7)
        );
    }

    @Test
    void getPhotos_CacheHit_ReturnsCachedList() throws JsonProcessingException {
        String rover = "curiosity";
        String cacheKey = "mars:photos:curiosity";
        String cachedJson = "[{\"photoId\":123}]";
        List<MarsPhoto> expectedPhotos = List.of(new MarsPhoto());

        when(valueOperations.get(cacheKey)).thenReturn(cachedJson);
        when(objectMapper.readValue(eq(cachedJson), any(TypeReference.class))).thenReturn(expectedPhotos);

        List<MarsPhoto> result = marsService.getPhotos(rover);

        assertEquals(expectedPhotos, result);
        verify(cacheHitsCounter).increment();
        verifyNoInteractions(marsPhotoRepository, nasaImageWebClient);
    }

    @Test
    void getPhotos_CacheMiss_DbHit_ReturnsDbListAndCaches() throws JsonProcessingException {
        String rover = "curiosity";
        String cacheKey = "mars:photos:curiosity";
        List<MarsPhoto> dbPhotos = List.of(new MarsPhoto());

        when(valueOperations.get(cacheKey)).thenReturn(null);
        when(marsPhotoRepository.findByRoverIgnoreCase("curiosity")).thenReturn(dbPhotos);
        when(objectMapper.writeValueAsString(dbPhotos)).thenReturn("[]");

        List<MarsPhoto> result = marsService.getPhotos(rover);

        assertEquals(dbPhotos, result);
        verify(cacheMissesCounter).increment();
        verify(valueOperations).set(eq(cacheKey), anyString(), eq(Duration.ofDays(7)));
        verifyNoInteractions(nasaImageWebClient);
    }

    @Test
    void getPhotos_CacheMiss_DbMiss_ApiFetchSuccess() throws JsonProcessingException {
        String rover = "curiosity";
        String cacheKey = "mars:photos:curiosity";

        when(valueOperations.get(cacheKey)).thenReturn(null);
        when(marsPhotoRepository.findByRoverIgnoreCase("curiosity")).thenReturn(Collections.emptyList());

        when(nasaImageWebClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);

        NasaImageLibraryResponseDto responseDto = new NasaImageLibraryResponseDto();
        NasaImageLibraryResponseDto.Collection collection = new NasaImageLibraryResponseDto.Collection();

        NasaImageLibraryResponseDto.ItemData data = new NasaImageLibraryResponseDto.ItemData();
        data.setNasaId("PIA12345");
        data.setTitle("Curiosity Rover on Mars");
        data.setDateCreated("2021-03-18T00:00:00Z");

        NasaImageLibraryResponseDto.ItemLink link = new NasaImageLibraryResponseDto.ItemLink();
        link.setHref("https://images-assets.nasa.gov/image/PIA12345/PIA12345~thumb.jpg");
        link.setRel("preview");

        NasaImageLibraryResponseDto.Item item = new NasaImageLibraryResponseDto.Item();
        item.setData(List.of(data));
        item.setLinks(List.of(link));

        collection.setItems(List.of(item));
        responseDto.setCollection(collection);

        when(responseSpec.bodyToMono(NasaImageLibraryResponseDto.class)).thenReturn(Mono.just(responseDto));
        when(objectMapper.writeValueAsString(anyList())).thenReturn("[]");

        List<MarsPhoto> result = marsService.getPhotos(rover);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("curiosity", result.get(0).getRover());
        assertEquals("https://images-assets.nasa.gov/image/PIA12345/PIA12345~thumb.jpg",
                result.get(0).getImgSrc());
        verify(marsPhotoRepository).saveAll(any());
        verify(valueOperations).set(eq(cacheKey), anyString(), any(Duration.class));
    }

    @Test
    void getPhotos_CacheMiss_DbMiss_NasaFailure_ReturnsEmptyListInsteadOfThrowing()
            throws JsonProcessingException {
        String rover = "curiosity";
        String cacheKey = "mars:photos:curiosity";

        when(valueOperations.get(cacheKey)).thenReturn(null);
        when(marsPhotoRepository.findByRoverIgnoreCase("curiosity")).thenReturn(Collections.emptyList());

        when(nasaImageWebClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(NasaImageLibraryResponseDto.class))
                .thenReturn(Mono.error(
                        WebClientResponseException.create(503, "Service Unavailable", null, null, null)));
        when(objectMapper.writeValueAsString(Collections.emptyList())).thenReturn("[]");

        List<MarsPhoto> result = assertDoesNotThrow(() -> marsService.getPhotos(rover));
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
