package com.space.visualiser_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_explanations")
@Data
public class AiExplanation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", length = 50, nullable = false)
    private String eventType;

    @Column(name = "event_id", length = 100, nullable = false)
    private String eventId;

    @Column(name = "prompt_hash", length = 64, nullable = false)
    private String promptHash;

    @Column(name = "explanation_text", nullable = false, columnDefinition = "TEXT")
    private String explanationText;

    @Column(name = "tokens_used", nullable = false)
    private int tokensUsed;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
