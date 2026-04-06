package com.space.visualiser_api.visualiser.ingestion;

import com.space.visualiser_api.entity.ApodEntry;
import com.space.visualiser_api.repository.ApodRepository;
import com.space.visualiser_api.visualiser.dto.ApodResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Component
public class ApodIngestionJob {

    private final WebClient nasaWebClient;
    private final ApodRepository apodRepository;
    private final StringRedisTemplate redisTemplate;
    private final String nasaApiKey;

    public ApodIngestionJob(
            WebClient nasaWebClient,
            ApodRepository apodRepository,
            StringRedisTemplate redisTemplate,
            @Value("${app.nasa.api-key:DEMO_KEY}") String nasaApiKey
    ) {
        this.nasaWebClient = nasaWebClient;
        this.apodRepository = apodRepository;
        this.redisTemplate = redisTemplate;
        this.nasaApiKey = nasaApiKey;
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "UTC")
    public void fetchTodayApod() {
        fetchApodForDate(LocalDate.now(ZoneOffset.UTC));
    }

    public void ensureTodayApodExists() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!apodRepository.existsById(today)) {
            fetchApodForDate(today);
        }
    }

    private void fetchApodForDate(LocalDate date) {
        ApodResponseDto response = nasaWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/planetary/apod")
                        .queryParam("api_key", nasaApiKey)
                        .queryParam("date", date)
                        .build())
                .retrieve()
                .bodyToMono(ApodResponseDto.class)
                .block();

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
