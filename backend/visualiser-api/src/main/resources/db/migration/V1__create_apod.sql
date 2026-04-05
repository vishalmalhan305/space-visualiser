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

