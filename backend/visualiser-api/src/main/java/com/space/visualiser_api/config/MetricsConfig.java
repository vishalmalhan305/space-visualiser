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

    @Bean("asteroidQueryTimer")
    public io.micrometer.core.instrument.Timer asteroidQueryTimer(MeterRegistry meterRegistry) {
        return io.micrometer.core.instrument.Timer.builder("asteroid.query.latency")
                .description("Latency for asteroid page queries")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);
    }
}
