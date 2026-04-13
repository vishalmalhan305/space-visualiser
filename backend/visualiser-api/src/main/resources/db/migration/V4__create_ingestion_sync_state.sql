CREATE TABLE ingestion_sync_state (
    sync_key                 VARCHAR(100) PRIMARY KEY,
    last_successful_sync_at  TIMESTAMP,
    last_attempted_sync_at   TIMESTAMP NOT NULL,
    last_status              VARCHAR(20) NOT NULL,
    last_error               TEXT,
    updated_at               TIMESTAMP NOT NULL DEFAULT NOW()
);
