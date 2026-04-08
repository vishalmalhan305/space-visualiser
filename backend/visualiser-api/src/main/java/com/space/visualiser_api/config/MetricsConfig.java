package com.space.visualiser_api.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean("spaceCacheHitsCounter")
    public Counter spaceCacheHitsCounter(MeterRegistry meterRegistry) {
        return Counter.builder("space.cache.hits")
                .description("Total cache hits across space APIs")
                .register(meterRegistry);
    }

    @Bean("spaceCacheMissesCounter")
    public Counter spaceCacheMissesCounter(MeterRegistry meterRegistry) {
        return Counter.builder("space.cache.misses")
                .description("Total cache misses across space APIs")
                .register(meterRegistry);
    }
}
