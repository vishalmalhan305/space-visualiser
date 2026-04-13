package com.space.visualiser_api.visualiser.dto;

public record AsteroidOrbitDto(
        String neoId,
        String name,
        double semiMajorAxis,
        double eccentricity,
        double inclination
) {
}
