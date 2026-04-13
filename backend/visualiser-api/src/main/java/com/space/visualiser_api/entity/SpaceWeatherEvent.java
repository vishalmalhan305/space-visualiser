package com.space.visualiser_api.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "space_weather_events")
@Data
public class SpaceWeatherEvent {
    @Id
    @Column(name = "event_id", nullable = false, length = 100)
    private String eventId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "type", columnDefinition = "weather_event_type", nullable = false)
    private SpaceWeatherEventType type;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "peak_time")
    private LocalDateTime peakTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "class_type", length = 100)
    private String classType;

    @Column(name = "source_location", length = 100)
    private String sourceLocation;

    @Column(name = "link", length = 1000)
    private String link;

    @Column(name = "ingested_at", nullable = false)
    private LocalDateTime ingestedAt;
}
