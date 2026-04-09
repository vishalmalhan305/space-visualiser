package com.space.visualiser_api.visualiser.dto;

import lombok.Data;

@Data
public class IssPositionDto {
    private double latitude;
    private double longitude;
    private double altitude_km;
    private double velocity_km_h;
    private long timestamp;


}
