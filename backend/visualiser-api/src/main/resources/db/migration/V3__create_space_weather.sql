CREATE TYPE weather_event_type AS ENUM ('FLARE', 'CME', 'GST', 'SEP');

CREATE TABLE space_weather_events (
    event_id         VARCHAR(100) PRIMARY KEY,
    type             weather_event_type NOT NULL,
    start_time       TIMESTAMP,
    peak_time        TIMESTAMP,
    end_time         TIMESTAMP,
    class_type       VARCHAR(100),
    source_location  VARCHAR(100),
    link             VARCHAR(1000)
);

CREATE INDEX idx_space_weather_events_type ON space_weather_events(type);
CREATE INDEX idx_space_weather_events_start_time ON space_weather_events(start_time);
