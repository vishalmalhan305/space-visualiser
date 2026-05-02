package com.space.visualiser_api.visualiser.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class NasaImageLibraryResponseDto {

    private Collection collection;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Collection {
        private List<Item> items;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        private List<ItemData> data;
        private List<ItemLink> links;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ItemData {
        @JsonProperty("nasa_id")
        private String nasaId;
        private String title;
        private String description;
        private List<String> keywords;
        @JsonProperty("date_created")
        private String dateCreated;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ItemLink {
        private String href;
        private String rel;
    }
}
