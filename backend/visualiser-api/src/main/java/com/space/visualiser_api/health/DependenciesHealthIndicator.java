package com.space.visualiser_api.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component("dependencies")
public class DependenciesHealthIndicator implements HealthIndicator {

    private static final Logger LOGGER = LoggerFactory.getLogger(DependenciesHealthIndicator.class);

    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;

    public DependenciesHealthIndicator(DataSource dataSource,
                                       RedisConnectionFactory redisConnectionFactory) {
        this.dataSource = dataSource;
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @Override
    public Health health() {
        boolean pgUp    = checkPostgres();
        boolean redisUp = checkRedis();

        Health.Builder builder = (pgUp && redisUp) ? Health.up() : Health.down();

        return builder
                .withDetail("postgres", pgUp    ? "UP" : "DOWN")
                .withDetail("redis",    redisUp ? "UP" : "DOWN")
                .build();
    }

    private boolean checkPostgres() {
        try (Connection conn = dataSource.getConnection()) {
            return conn.isValid(2);
        } catch (Exception e) {
            LOGGER.warn("Postgres health check failed", e);
            return false;
        }
    }

    private boolean checkRedis() {
        RedisConnection conn = redisConnectionFactory.getConnection();
        try {
            String pong = conn.ping();
            return "PONG".equalsIgnoreCase(pong);
        } catch (Exception e) {
            LOGGER.warn("Redis health check failed", e);
            return false;
        } finally {
            conn.close();
        }
    }
}
