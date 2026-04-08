package com.space.visualiser_api.visualiser.ingestion;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;

import com.space.visualiser_api.entity.SpaceWeatherEvent;
import com.space.visualiser_api.entity.SpaceWeatherEventType;
import com.space.visualiser_api.repository.SpaceWeatherEventRepository;
import com.space.visualiser_api.visualiser.dto.DonkiResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
public class DonkiIngestionJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(DonkiIngestionJob.class);
    private static final String WEATHER_CACHE_PREFIX = "weather:events:";
    private static final int LOOKBACK_DAYS = 30;

    private final WebClient nasaWebClient;
    private final SpaceWeatherEventRepository repository;
    private final StringRedisTemplate redisTemplate;
    private final String nasaApiKey;

    public DonkiIngestionJob(
            WebClient nasaWebClient,
            SpaceWeatherEventRepository repository,
            StringRedisTemplate redisTemplate,
            @Value("${app.nasa.api-key:${NASA_API_KEY:DEMO_KEY}}") String nasaApiKey
    ) {
        this.nasaWebClient = nasaWebClient;
        this.repository = repository;
        this.redisTemplate = redisTemplate;
        this.nasaApiKey = nasaApiKey;
    }

    @Scheduled(cron = "0 0 */6 * * *", zone = "UTC")
    public void ingestSpaceWeatherEvents() {
        LocalDate endDate = LocalDate.now(ZoneOffset.UTC);
        LocalDate startDate = endDate.minusDays(LOOKBACK_DAYS);
        try {
            ingestFlares(startDate, endDate);
            ingestCmes(startDate, endDate);
            evictWeatherCaches();
        } catch (RuntimeException exception) {
            LOGGER.warn(
                    "DONKI scheduled ingestion failed for {} to {}",
                    startDate,
                    endDate,
                    exception
            );
        }
    }

    private void ingestFlares(LocalDate startDate, LocalDate endDate) {
        List<DonkiResponseDto.FlareEventDto> flares;
        try {
            flares = nasaWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/DONKI/FLR")
                            .queryParam("api_key", nasaApiKey)
                            .queryParam("startDate", startDate)
                            .queryParam("endDate", endDate)
                            .build())
                    .retrieve()
                    .bodyToFlux(DonkiResponseDto.FlareEventDto.class)
                    .collectList()
                    .block();
        } catch (WebClientResponseException exception) {
            throw new IllegalStateException(
                    "NASA DONKI FLR request failed with status "
                            + exception.getStatusCode().value(),
                    exception
            );
        }

        if (flares == null || flares.isEmpty()) {
            return;
        }
        for (DonkiResponseDto.FlareEventDto flare : flares) {
            if (flare == null || flare.getEventId() == null || flare.getEventId().isBlank()) {
                continue;
            }
            SpaceWeatherEvent event = new SpaceWeatherEvent();
            event.setEventId(flare.getEventId());
            event.setType(SpaceWeatherEventType.FLARE);
            event.setStartTime(parseDateTime(flare.getStartTime()));
            event.setPeakTime(parseDateTime(flare.getPeakTime()));
            event.setEndTime(parseDateTime(flare.getEndTime()));
            event.setClassType(flare.getClassType());
            event.setSourceLocation(flare.getSourceLocation());
            event.setLink(flare.getLink());
            event.setIngestedAt(LocalDateTime.now(ZoneOffset.UTC));
            repository.save(event);
        }
    }

    private void ingestCmes(LocalDate startDate, LocalDate endDate) {
        List<DonkiResponseDto.CmeEventDto> cmes;
        try {
            cmes = nasaWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/DONKI/CME")
                            .queryParam("api_key", nasaApiKey)
                            .queryParam("startDate", startDate)
                            .queryParam("endDate", endDate)
                            .build())
                    .retrieve()
                    .bodyToFlux(DonkiResponseDto.CmeEventDto.class)
                    .collectList()
                    .block();
        } catch (WebClientResponseException exception) {
            throw new IllegalStateException(
                    "NASA DONKI CME request failed with status "
                            + exception.getStatusCode().value(),
                    exception
            );
        }

        if (cmes == null || cmes.isEmpty()) {
            return;
        }
        for (DonkiResponseDto.CmeEventDto cme : cmes) {
            if (cme == null || cme.getEventId() == null || cme.getEventId().isBlank()) {
                continue;
            }
            DonkiResponseDto.CmeAnalysisDto preferredAnalysis =
                    getPreferredAnalysis(cme.getAnalyses());
            SpaceWeatherEvent event = new SpaceWeatherEvent();
            event.setEventId(cme.getEventId());
            event.setType(SpaceWeatherEventType.CME);
            event.setStartTime(parseDateTime(cme.getStartTime()));
            event.setPeakTime(preferredAnalysis != null
                    ? parseDateTime(preferredAnalysis.getTime215())
                    : null);
            event.setEndTime(null);
            event.setClassType(
                    preferredAnalysis != null ? preferredAnalysis.getClassType() : null
            );
            event.setSourceLocation(
                    preferredAnalysis != null ? preferredAnalysis.getSourceLocation() : null
            );
            event.setLink(cme.getLink());
            event.setIngestedAt(LocalDateTime.now(ZoneOffset.UTC));
            repository.save(event);
        }
    }

    private DonkiResponseDto.CmeAnalysisDto getPreferredAnalysis(
            List<DonkiResponseDto.CmeAnalysisDto> analyses
    ) {
        if (analyses == null || analyses.isEmpty()) {
            return null;
        }
        return analyses.getFirst();
    }

    private LocalDateTime parseDateTime(String dateTime) {
        if (dateTime == null || dateTime.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(dateTime).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            return LocalDateTime.parse(dateTime);
        }
    }

    private void evictWeatherCaches() {
        Set<String> keys = redisTemplate.keys(WEATHER_CACHE_PREFIX + "*");
        if (keys == null || keys.isEmpty()) {
            return;
        }
        redisTemplate.delete(keys);
    }
}
