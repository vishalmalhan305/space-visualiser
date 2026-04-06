package com.space.visualiser_api.controller;

import com.space.visualiser_api.entity.ApodEntry;
import com.space.visualiser_api.service.ApodService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
