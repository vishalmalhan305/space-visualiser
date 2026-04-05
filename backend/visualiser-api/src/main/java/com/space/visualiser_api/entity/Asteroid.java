package com.space.visualiser_api.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "asteroids") @Data
public class Asteroid {
    @Id
    private String neo_id;
    private String name;
    private double est_diameter_km_min;
    private double est_diameter_km_max;
    private boolean is_potentially_hazardous;
    private LocalDate close_approach_date;
    private double velocity_kmh;
    private double miss_distance_km;
    private double semi_major_axis;
    private double eccentricity;
    private double inclination;
    private LocalDateTime ingested_at;
}
