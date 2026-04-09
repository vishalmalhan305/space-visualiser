package com.space.visualiser_api.visualiser.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class IssPositionDto {
    private double latitude;
    private double longitude;

    @JsonAlias("altitude")
    private double altitude_km;

    @JsonAlias("velocity")
    private double velocity_km_h;

    private long timestamp;
}
