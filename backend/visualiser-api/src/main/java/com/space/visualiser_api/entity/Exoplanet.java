package com.space.visualiser_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "exoplanets")
@Data
public class Exoplanet {

    @Id
    @Column(name = "pl_name", length = 200)
    private String plName;

    @Column(name = "hostname", length = 200)
    private String hostname;

    @Column(name = "pl_orbper")
    private Double plOrbper;

    @Column(name = "pl_rade")
    private Double plRade;

    @Column(name = "pl_masse")
    private Double plMasse;

    @Column(name = "discoverymethod", length = 100)
    private String discoverymethod;

    @Column(name = "disc_year")
    private Integer discYear;

    @Column(name = "st_teff")
    private Double stTeff;

    @Column(name = "ingested_at", nullable = false)
    private LocalDateTime ingestedAt;
}
