package com.space.visualiser_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name="apod_entries") @Data
public class ApodEntry {
    @Id
    private LocalDate date;
    private String title;
    @Column(columnDefinition = "Text")
    private String explanation;
    private String url;
    private String hdurl;
    private String mediaType;
    private String copyright;
    private LocalDateTime fetchedAt;

}
