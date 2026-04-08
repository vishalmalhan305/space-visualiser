package com.space.visualiser_api.controller.dto;

public record MonthlyWeatherStatsDto(
        int year,
        int month,
        long count
) {
}
