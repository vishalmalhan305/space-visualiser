package com.space.visualiser_api.visualiser.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class NasaMarsPhotoResponseDto {

    private List<NasaMarsPhotoDto> photos;

    @Data
    public static class NasaMarsPhotoDto {
        private Long id;
        private Integer sol;
        private CameraDto camera;
        @JsonProperty("img_src")
        private String imgSrc;
        @JsonProperty("earth_date")
        private String earthDate;
        private RoverDto rover;
    }

    @Data
    public static class CameraDto {
        private Long id;
        private String name;
        @JsonProperty("rover_id")
        private Long roverId;
        @JsonProperty("full_name")
        private String fullName;
    }

    @Data
    public static class RoverDto {
        private Long id;
        private String name;
        @JsonProperty("landing_date")
        private String landingDate;
        @JsonProperty("launch_date")
        private String launchDate;
        private String status;
    }
}
