package com.space.visualiser_api.visualiser.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class NeoWsResponseDto {

    @JsonProperty("near_earth_objects")
    private Map<String, List<NearEarthObjectDto>> nearEarthObjects;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class NearEarthObjectDto {
        private String id;
        private String name;

        @JsonProperty("estimated_diameter")
        private EstimatedDiameterDto estimatedDiameter;

        @JsonProperty("is_potentially_hazardous_asteroid")
        private boolean potentiallyHazardousAsteroid;

        @JsonProperty("close_approach_data")
        private List<CloseApproachDataDto> closeApproachData;

        @JsonProperty("orbital_data")
        private OrbitalDataDto orbitalData;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EstimatedDiameterDto {
        private DiameterRangeDto kilometers;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DiameterRangeDto {
        @JsonProperty("estimated_diameter_min")
        private double estimatedDiameterMin;

        @JsonProperty("estimated_diameter_max")
        private double estimatedDiameterMax;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CloseApproachDataDto {
        @JsonProperty("close_approach_date")
        private String closeApproachDate;

        @JsonProperty("relative_velocity")
        private RelativeVelocityDto relativeVelocity;

        @JsonProperty("miss_distance")
        private MissDistanceDto missDistance;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RelativeVelocityDto {
        @JsonProperty("kilometers_per_hour")
        private String kilometersPerHour;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MissDistanceDto {
        private String kilometers;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OrbitalDataDto {
        @JsonProperty("semi_major_axis")
        private String semiMajorAxis;

        private String eccentricity;
        private String inclination;

        @JsonProperty("ascending_node_longitude")
        private String ascendingNodeLongitude;

        @JsonProperty("perihelion_argument")
        private String perihelionArgument;

        @JsonProperty("mean_anomaly")
        private String meanAnomaly;

        /** Epoch of osculation in Julian Day Number (TDB). */
        @JsonProperty("epoch_osculation")
        private String epochOsculation;
    }
}
