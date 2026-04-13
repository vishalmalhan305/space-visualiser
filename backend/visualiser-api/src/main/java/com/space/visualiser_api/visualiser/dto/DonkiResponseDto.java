package com.space.visualiser_api.visualiser.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

public final class DonkiResponseDto {

    private DonkiResponseDto() {
    }

    @Data
    public static class FlareEventDto {
        @JsonProperty("flrID")
        private String eventId;

        @JsonProperty("beginTime")
        private String startTime;

        @JsonProperty("peakTime")
        private String peakTime;

        @JsonProperty("endTime")
        private String endTime;

        private String classType;
        private String sourceLocation;
        private String link;
    }

    @Data
    public static class CmeEventDto {
        @JsonProperty("activityID")
        private String eventId;

        @JsonProperty("startTime")
        private String startTime;

        private String link;

        @JsonProperty("cmeAnalyses")
        private List<CmeAnalysisDto> analyses;
    }

    @Data
    public static class CmeAnalysisDto {
        @JsonProperty("time21_5")
        private String time215;

        private String latitude;
        private String longitude;
        private String speed;

        @JsonProperty("type")
        private String classType;

        private String sourceLocation;
    }
}
