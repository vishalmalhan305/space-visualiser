package com.space.visualiser_api.visualiser.ingestion;

import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.repository.AsteroidRepository;
import com.space.visualiser_api.repository.IngestionSyncStateRepository;
import com.space.visualiser_api.visualiser.dto.NeoWsResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings({"unchecked", "rawtypes"})
class NeoWsIngestionJobTest {

    @Captor
    private ArgumentCaptor<List<Asteroid>> asteroidCaptor;

    @Mock
    private WebClient nasaWebClient;
    @Mock
    private AsteroidRepository asteroidRepository;
    @Mock
    private IngestionSyncStateRepository ingestionSyncStateRepository;
    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;
    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;
    @Mock
    private WebClient.ResponseSpec responseSpec;

    private NeoWsIngestionJob ingestionJob;

    @BeforeEach
    void setUp() {
        ingestionJob = new NeoWsIngestionJob(
                nasaWebClient,
                asteroidRepository,
                ingestionSyncStateRepository,
                redisTemplate,
                "TEST_KEY"
        );
    }

    @Test
    void fetchAsteroidsForRange_SuccessfulFetch_SavesToRepository() {
        // Arrange
        LocalDate startDate = LocalDate.of(2023, 1, 1);
        LocalDate endDate = LocalDate.of(2023, 1, 1);

        NeoWsResponseDto responseDto = new NeoWsResponseDto();
        NeoWsResponseDto.NearEarthObjectDto neoDto = new NeoWsResponseDto.NearEarthObjectDto();
        neoDto.setId("AST1");
        neoDto.setName("Asteroid 1");
        
        NeoWsResponseDto.EstimatedDiameterDto diameterDto = new NeoWsResponseDto.EstimatedDiameterDto();
        NeoWsResponseDto.DiameterRangeDto kmDto = new NeoWsResponseDto.DiameterRangeDto();
        kmDto.setEstimatedDiameterMin(0.5);
        kmDto.setEstimatedDiameterMax(1.0);
        diameterDto.setKilometers(kmDto);
        neoDto.setEstimatedDiameter(diameterDto);

        NeoWsResponseDto.CloseApproachDataDto approachDto = new NeoWsResponseDto.CloseApproachDataDto();
        approachDto.setCloseApproachDate("2023-01-01");
        NeoWsResponseDto.RelativeVelocityDto velocityDto = new NeoWsResponseDto.RelativeVelocityDto();
        velocityDto.setKilometersPerHour("10000");
        approachDto.setRelativeVelocity(velocityDto);
        NeoWsResponseDto.MissDistanceDto missDto = new NeoWsResponseDto.MissDistanceDto();
        missDto.setKilometers("500000");
        approachDto.setMissDistance(missDto);
        neoDto.setCloseApproachData(List.of(approachDto));

        responseDto.setNearEarthObjects(Map.of("2023-01-01", List.of(neoDto)));

        when(nasaWebClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(NeoWsResponseDto.class)).thenReturn(Mono.just(responseDto));
        
        when(ingestionSyncStateRepository.findById(anyString())).thenReturn(java.util.Optional.empty());

        // Act
        ingestionJob.fetchAsteroidsForRange(startDate, endDate);

        // Assert
        verify(asteroidRepository).saveAll(asteroidCaptor.capture());

        List<Asteroid> saved = asteroidCaptor.getValue();
        assertEquals(1, saved.size());
        assertEquals("AST1", saved.get(0).getNeoId());
        assertEquals(10000.0, saved.get(0).getVelocity_kmh());
        
        verify(ingestionSyncStateRepository, atLeastOnce()).save(any());
    }
}
