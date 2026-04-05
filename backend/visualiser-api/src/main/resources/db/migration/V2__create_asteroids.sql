-- File: src/main/resources/db/migration/V2__create_asteroids.sql
CREATE TABLE asteroids (
                           neo_id                      VARCHAR(20) PRIMARY KEY,
                           name                        VARCHAR(200),
                           est_diameter_km_min         DOUBLE PRECISION,
                           est_diameter_km_max         DOUBLE PRECISION,
                           is_potentially_hazardous    BOOLEAN NOT NULL DEFAULT FALSE,
                           close_approach_date         DATE,
                           velocity_kmh                DOUBLE PRECISION,
                           miss_distance_km            DOUBLE PRECISION,
                           semi_major_axis             DOUBLE PRECISION,
                           eccentricity                DOUBLE PRECISION,
                           inclination                 DOUBLE PRECISION,
                           ingested_at                 TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_asteroids_approach_date ON asteroids(close_approach_date);
CREATE INDEX idx_asteroids_hazardous     ON asteroids(is_potentially_hazardous);

