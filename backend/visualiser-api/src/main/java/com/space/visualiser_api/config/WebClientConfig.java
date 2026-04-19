package com.space.visualiser_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient nasaWebClient(@Value("${app.nasa.base-url:https://api.nasa.gov}") String baseUrl) {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    @Bean
    public WebClient issWebClient(@Value("${app.iss.base-url:https://api.wheretheiss.at/v1}") String baseUrl) {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    @Bean
    public WebClient geminiWebClient(
            @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}") String baseUrl) {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    @Bean
    public WebClient tapWebClient(
            @Value("${app.exoplanets.tap-url:https://exoplanetarchive.ipac.caltech.edu/TAP/sync}") String tapUrl) {
        return WebClient.builder()
                .baseUrl(tapUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
    }
}
