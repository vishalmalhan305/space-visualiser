package com.space.visualiser_api.controller.dto;

public class IssPositionDto {
    private double latitude;
    private double longitude;
    private double altitude_km;
    private double velocity_km_h;
    private long timestamp;

    public IssPositionDto() {}

    public IssPositionDto(double latitude, double longitude, double altitude_km, double velocity_km_h, long timestamp) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.altitude_km = altitude_km;
        this.velocity_km_h = velocity_km_h;
        this.timestamp = timestamp;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public double getAltitude_km() {
        return altitude_km;
    }

    public void setAltitude_km(double altitude_km) {
        this.altitude_km = altitude_km;
    }

    public double getVelocity_km_h() {
        return velocity_km_h;
    }

    public void setVelocity_km_h(double velocity_km_h) {
        this.velocity_km_h = velocity_km_h;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
