package com.space.visualiser_api.visualiser.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ApodResponseDto {
    private String date;
    private String title;
    private String explanation;
    private String url;
    private String hdurl;
    @JsonProperty("media_type")
    private String mediaType;

}
