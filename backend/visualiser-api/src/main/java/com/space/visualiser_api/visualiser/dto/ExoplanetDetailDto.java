package com.space.visualiser_api.visualiser.dto;

import lombok.Data;

@Data
public class ExoplanetDetailDto {
    private String plName;
    private String hostname;
    private Double plOrbper;
    private Double plRade;
    private Double plMasse;
    private String discoverymethod;
    private Integer discYear;
    private Double stTeff;
}
