package com.space.visualiser_api.visualiser.ingestion;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.entity.IngestionSyncState;
import com.space.visualiser_api.repository.AsteroidRepository;
import com.space.visualiser_api.repository.IngestionSyncStateRepository;
import com.space.visualiser_api.visualiser.dto.NeoWsResponseDto;

@Component
public class NeoWsIngestionJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(NeoWsIngestionJob.class);
    private static final String NEOWS_SYNC_KEY = "neows:weekly";
    private static final String STATUS_SUCCESS = "SUCCESS";
    private static final String STATUS_FAILED = "FAILED";

    private final WebClient nasaWebClient;
    private final AsteroidRepository asteroidRepository;
    private final IngestionSyncStateRepository ingestionSyncStateRepository;
    private final StringRedisTemplate redisTemplate;
    private final String nasaApiKey;

    public NeoWsIngestionJob(
            WebClient nasaWebClient,
            AsteroidRepository asteroidRepository,
            IngestionSyncStateRepository ingestionSyncStateRepository,
            StringRedisTemplate redisTemplate,
            @Value("${app.nasa.api-key:${NASA_API_KEY:DEMO_KEY}}") String nasaApiKey
    ) {
        this.nasaWebClient = nasaWebClient;
        this.asteroidRepository = asteroidRepository;
        this.ingestionSyncStateRepository = ingestionSyncStateRepository;
        this.redisTemplate = redisTemplate;
        this.nasaApiKey = nasaApiKey;
    }

    @Scheduled(cron = "0 10 0 * * *", zone = "UTC")
    public void fetchWeeklyAsteroids() {
        LocalDate startDate = LocalDate.now(ZoneOffset.UTC);
        LocalDate endDate = startDate.plusDays(6);
        try {
            fetchAsteroidsForRange(startDate, endDate);
        } catch (RuntimeException exception) {
            LOGGER.warn("NeoWs scheduled ingestion failed for {} to {}", startDate, endDate, exception);
        }
    }

    public void ensureCurrentWeekExists() {
        LocalDate startDate = LocalDate.now(ZoneOffset.UTC);
        LocalDate endDate = startDate.plusDays(6);
        LocalDate lastSuccessDate = getLastSuccessDate();
        boolean missingCurrentWeek = asteroidRepository.findByCloseApproachDateBetweenOrderByCloseApproachDateAsc(
                startDate,
                endDate
        ).isEmpty();
        boolean wasNotSyncedToday = lastSuccessDate == null || lastSuccessDate.isBefore(startDate);

        if (!missingCurrentWeek && !wasNotSyncedToday) {
            return;
        }

        try {
            fetchAsteroidsForRange(startDate, endDate);
        } catch (RuntimeException exception) {
            LOGGER.warn("NeoWs startup bootstrap failed for {} to {}", startDate, endDate, exception);
        }
    }

    private LocalDate getLastSuccessDate() {
        Optional<IngestionSyncState> syncState = ingestionSyncStateRepository.findById(NEOWS_SYNC_KEY);
        return syncState.map(IngestionSyncState::getLastSuccessfulSyncAt)
                .map(value -> value.atOffset(ZoneOffset.UTC).toLocalDate())
                .orElse(null);
    }

    private void markSyncSuccess() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        IngestionSyncState state = ingestionSyncStateRepository.findById(NEOWS_SYNC_KEY)
                .orElseGet(() -> {
                    IngestionSyncState created = new IngestionSyncState();
                    created.setSyncKey(NEOWS_SYNC_KEY);
                    return created;
                });
        state.setLastAttemptedSyncAt(now);
        state.setLastSuccessfulSyncAt(now);
        state.setLastStatus(STATUS_SUCCESS);
        state.setLastError(null);
        state.setUpdatedAt(now);
        ingestionSyncStateRepository.save(state);
    }

    private void markSyncFailure(RuntimeException exception) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        IngestionSyncState state = ingestionSyncStateRepository.findById(NEOWS_SYNC_KEY)
                .orElseGet(() -> {
                    IngestionSyncState created = new IngestionSyncState();
                    created.setSyncKey(NEOWS_SYNC_KEY);
                    return created;
                });
        state.setLastAttemptedSyncAt(now);
        state.setLastStatus(STATUS_FAILED);
        state.setLastError(exception.getMessage());
        state.setUpdatedAt(now);
        ingestionSyncStateRepository.save(state);
    }

    private void updateSyncState(Runnable fetchWork) {
        try {
            fetchWork.run();
            markSyncSuccess();
        } catch (RuntimeException exception) {
            markSyncFailure(exception);
            throw exception;
        }
    }

    public void fetchAsteroidsForRange(LocalDate startDate, LocalDate endDate) {
        updateSyncState(() -> {
            NeoWsResponseDto response;
            try {
                response = nasaWebClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/neo/rest/v1/feed")
                                .queryParam("api_key", nasaApiKey)
                                .queryParam("start_date", startDate)
                                .queryParam("end_date", endDate)
                                .build())
                        .retrieve()
                        .bodyToMono(NeoWsResponseDto.class)
                        .block();
            } catch (WebClientResponseException exception) {
                throw new IllegalStateException(
                        "NASA NeoWs request failed with status " + exception.getStatusCode().value(),
                        exception
                );
            }

            if (response == null || response.getNearEarthObjects() == null) {
                throw new IllegalStateException("NASA NeoWs response was empty");
            }

            List<Asteroid> asteroids = mapResponse(response.getNearEarthObjects());
            asteroidRepository.saveAll(asteroids);
            evictRangeCaches(startDate, endDate);
        });
    }

    private List<Asteroid> mapResponse(Map<String, List<NeoWsResponseDto.NearEarthObjectDto>> nearEarthObjects) {
        List<Asteroid> asteroids = new ArrayList<>();
        for (List<NeoWsResponseDto.NearEarthObjectDto> dailyObjects : nearEarthObjects.values()) {
            for (NeoWsResponseDto.NearEarthObjectDto objectDto : dailyObjects) {
                if (objectDto == null
                        || objectDto.getCloseApproachData() == null
                        || objectDto.getCloseApproachData().isEmpty()
                        || objectDto.getOrbitalData() == null
                        || objectDto.getEstimatedDiameter() == null
                        || objectDto.getEstimatedDiameter().getKilometers() == null) {
                    continue;
                }

                NeoWsResponseDto.CloseApproachDataDto approachData = objectDto.getCloseApproachData().getFirst();
                if (approachData.getRelativeVelocity() == null || approachData.getMissDistance() == null) {
                    continue;
                }

                Asteroid asteroid = new Asteroid();
                asteroid.setNeoId(objectDto.getId());
                asteroid.setName(objectDto.getName());
                asteroid.setEstDiameterKmMin(objectDto.getEstimatedDiameter().getKilometers().getEstimatedDiameterMin());
                asteroid.setEstDiameterKmMax(objectDto.getEstimatedDiameter().getKilometers().getEstimatedDiameterMax());
                asteroid.setPotentiallyHazardous(objectDto.isPotentiallyHazardousAsteroid());
                try {
                    asteroid.setCloseApproachDate(LocalDate.parse(approachData.getCloseApproachDate()));
                    asteroid.setVelocity_kmh(parseDouble(approachData.getRelativeVelocity().getKilometersPerHour()));
                    asteroid.setMissDistanceKm(parseDouble(approachData.getMissDistance().getKilometers()));
                    asteroid.setSemi_major_axis(parseDouble(objectDto.getOrbitalData().getSemiMajorAxis()));
                    asteroid.setEccentricity(parseDouble(objectDto.getOrbitalData().getEccentricity()));
                    asteroid.setInclination(parseDouble(objectDto.getOrbitalData().getInclination()));
                    asteroid.setIngestedAt(LocalDateTime.now(ZoneOffset.UTC));
                    asteroids.add(asteroid);
                } catch (RuntimeException exception) {
                    LOGGER.debug("Skipping malformed NeoWs object {}", objectDto.getId(), exception);
                }
            }
        }
        return asteroids;
    }

    private void evictRangeCaches(LocalDate startDate, LocalDate endDate) {
        redisTemplate.delete(buildCacheKey(startDate, endDate));
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            redisTemplate.delete(buildCacheKey(current, current));
            current = current.plusDays(1);
        }
    }

    private String buildCacheKey(LocalDate startDate, LocalDate endDate) {
        return "asteroids:" + startDate + ":" + endDate;
    }

    private double parseDouble(String value) {
        return Double.parseDouble(value);
    }
}
