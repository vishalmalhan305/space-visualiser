package com.space.visualiser_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

import lombok.Data;

@Entity
@Table(name = "ingestion_sync_state")
@Data
public class IngestionSyncState {

    @Id
    @Column(name = "sync_key", nullable = false, length = 100)
    private String syncKey;

    @Column(name = "last_successful_sync_at")
    private LocalDateTime lastSuccessfulSyncAt;

    @Column(name = "last_attempted_sync_at", nullable = false)
    private LocalDateTime lastAttemptedSyncAt;

    @Column(name = "last_status", nullable = false, length = 20)
    private String lastStatus;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
