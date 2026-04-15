package com.space.visualiser_api.visualiser.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AsteroidOrbitDto(
        String neoId,
        String name,
        @JsonProperty("semi_major_axis")
        double semiMajorAxis,
        double eccentricity,
        double inclination,
        @JsonProperty("ascending_node_longitude")
        double ascendingNodeLongitude,
        @JsonProperty("perihelion_argument")
        double perihelionArgument,
        @JsonProperty("mean_anomaly")
        double meanAnomaly,
        /** Epoch of osculation in Julian Day Number (TDB). */
        @JsonProperty("epoch_osculation")
        double epochOsculation
) {
}
