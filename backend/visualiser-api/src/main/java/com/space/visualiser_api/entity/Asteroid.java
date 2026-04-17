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
@Table(name = "asteroids")
@Data
public class Asteroid {

    @Id
    @Column(name = "neo_id", length = 20)
    private String neoId;

    @Column(length = 200)
    private String name;

    @Column(name = "est_diameter_km_min")
    private double estDiameterKmMin;

    @Column(name = "est_diameter_km_max")
    private double estDiameterKmMax;

    @org.hibernate.annotations.Formula("(est_diameter_km_min + est_diameter_km_max) / 2")
    private double averageDiameterKm;

    @Column(name = "is_potentially_hazardous", nullable = false)
    private boolean potentiallyHazardous;

    @Column(name = "close_approach_date")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate closeApproachDate;

    @Column(name = "velocity_kmh")
    private double velocity_kmh;

    @Column(name = "miss_distance_km")
    private double missDistanceKm;

    @Column(name = "semi_major_axis")
    private double semi_major_axis;

    private double eccentricity;

    private double inclination;

    @Column(name = "ascending_node_longitude")
    private Double ascendingNodeLongitude;

    @Column(name = "perihelion_argument")
    private Double perihelionArgument;

    @Column(name = "mean_anomaly")
    private Double meanAnomaly;

    /** Epoch of osculation in Julian Day Number (TDB). */
    @Column(name = "epoch_osculation")
    private Double epochOsculation;

    @Column(name = "ingested_at", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime ingestedAt;
}
