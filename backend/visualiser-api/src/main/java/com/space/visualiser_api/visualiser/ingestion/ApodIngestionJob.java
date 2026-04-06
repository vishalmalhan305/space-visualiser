package com.space.visualiser_api.visualiser.ingestion;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.space.visualiser_api.entity.ApodEntry;
import com.space.visualiser_api.repository.ApodRepository;
import com.space.visualiser_api.visualiser.dto.ApodResponseDto;

@Component
public class ApodIngestionJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApodIngestionJob.class);

    private final WebClient nasaWebClient;
    private final ApodRepository apodRepository;
    private final StringRedisTemplate redisTemplate;
    private final String nasaApiKey;

    public ApodIngestionJob(
            WebClient nasaWebClient,
            ApodRepository apodRepository,
            StringRedisTemplate redisTemplate,
            @Value("${app.nasa.api-key:${NASA_API_KEY:DEMO_KEY}}") String nasaApiKey
    ) {
        this.nasaWebClient = nasaWebClient;
        this.apodRepository = apodRepository;
        this.redisTemplate = redisTemplate;
        this.nasaApiKey = nasaApiKey;
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "UTC")
    public void fetchTodayApod() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        try {
            fetchApodForDate(today);
        } catch (RuntimeException exception) {
            LOGGER.warn("APOD scheduled ingestion failed for {}: {}", today, exception.getMessage());
        }
    }

    public void ensureTodayApodExists() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!apodRepository.existsById(today)) {
            try {
                fetchApodForDate(today);
            } catch (RuntimeException exception) {
                LOGGER.warn("APOD startup seed skipped for {}: {}", today, exception.getMessage());
            }
        }
    }

    public void fetchApodForDate(LocalDate date) {
        ApodResponseDto response;
        try {
            response = nasaWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/planetary/apod")
                            .queryParam("api_key", nasaApiKey)
                            .queryParam("date", date)
                            .build())
                    .retrieve()
                    .bodyToMono(ApodResponseDto.class)
                    .block();
        } catch (WebClientResponseException exception) {
            throw new IllegalStateException(
                    "NASA APOD request failed with status " + exception.getStatusCode().value(),
                    exception
            );
        }

        if (response == null) {
            throw new IllegalStateException("NASA APOD response was empty");
        }

        apodRepository.save(mapToEntity(response));
        redisTemplate.delete(buildCacheKey(date));
    }

    private ApodEntry mapToEntity(ApodResponseDto response) {
        ApodEntry apodEntry = new ApodEntry();
        apodEntry.setDate(LocalDate.parse(response.getDate()));
        apodEntry.setTitle(response.getTitle());
        apodEntry.setExplanation(response.getExplanation());
        apodEntry.setUrl(response.getUrl());
        apodEntry.setHdurl(response.getHdurl());
        apodEntry.setMediaType(response.getMediaType());
        apodEntry.setCopyright(response.getCopyright());
        apodEntry.setFetchedAt(LocalDateTime.now(ZoneOffset.UTC));
        return apodEntry;
    }

    private String buildCacheKey(LocalDate date) {
        return "apod:" + date;
    }
}
