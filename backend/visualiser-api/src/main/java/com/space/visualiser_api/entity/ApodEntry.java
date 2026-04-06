package com.space.visualiser_api.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "apod_entries")
@Data
public class ApodEntry {

    @Id
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate date;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(length = 1000)
    private String url;

    @Column(length = 1000)
    private String hdurl;

    @Column(name = "media_type", length = 20)
    private String mediaType;

    @Column(length = 200)
    private String copyright;

    @Column(name = "fetched_at", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fetchedAt;
}
