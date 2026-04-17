package com.space.visualiser_api.visualiser.dto;

public record MonthlyWeatherStatsDto(
        int year,
        int month,
        long count
) {
}
