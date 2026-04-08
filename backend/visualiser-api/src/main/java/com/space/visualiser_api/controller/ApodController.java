package com.space.visualiser_api.controller;

import com.space.visualiser_api.entity.ApodEntry;
import com.space.visualiser_api.service.ApodService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/apod")
public class ApodController {

    private final ApodService apodService;

    public ApodController(ApodService apodService) {
        this.apodService = apodService;
    }

    @GetMapping("/today")
    public ApodEntry getToday() {
        return apodService.getToday();
    }

    @GetMapping("/archive")
    public List<ApodEntry> getArchive(
            @RequestParam(defaultValue = "30") int count
    ) {
        return apodService.getArchive(count);
    }

    @GetMapping("/{date}")
    public ApodEntry getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return apodService.getByDate(date);
    }
}
