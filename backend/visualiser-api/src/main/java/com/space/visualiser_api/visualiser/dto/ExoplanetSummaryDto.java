package com.space.visualiser_api.visualiser.dto;

import lombok.Data;

@Data
public class ExoplanetSummaryDto {
    private String plName;
    private Double plOrbper;
    private Double plRade;
    private String discoverymethod;
    private Integer discYear;
}
