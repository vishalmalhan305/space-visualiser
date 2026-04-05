package com.space.visualiser_api.visualiser.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {
    @Bean
    public WebClient nasaWebClient() {
        return WebClient.builder()
                .baseUrl("https://api.nasa.gov")
                .build();
    }
}
