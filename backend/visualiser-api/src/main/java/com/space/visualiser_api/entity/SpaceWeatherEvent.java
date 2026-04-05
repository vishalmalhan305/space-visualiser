package com.space.visualiser_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "space_weather_events")
@Data
public class SpaceWeatherEvent {
    @Id
    private String event_id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "weather_event_type", nullable = false)
    private SpaceWeatherEventType type;

    private LocalDateTime start_time;
    private LocalDateTime peak_time;
    private LocalDateTime end_time;
    private String class_type;
    private String source_location;
    private String link;
}
