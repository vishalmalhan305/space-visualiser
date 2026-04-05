-- File: src/main/resources/db/migration/V1__create_apod.sql
CREATE TABLE apod_entries (
    date         DATE PRIMARY KEY,
    title        VARCHAR(500) NOT NULL,
    explanation  TEXT,
    url          VARCHAR(1000),
    hdurl        VARCHAR(1000),
    media_type   VARCHAR(20),
    copyright    VARCHAR(200),
    fetched_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

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

-- File: src/main/resources/db/migration/V3__create_space_weather.sql
CREATE TYPE weather_event_type AS ENUM ('FLARE', 'CME', 'GST', 'SEP');
