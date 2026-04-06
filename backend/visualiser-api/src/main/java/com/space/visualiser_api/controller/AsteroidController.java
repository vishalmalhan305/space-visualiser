package com.space.visualiser_api.controller;

import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.service.AsteroidService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/asteroids")
public class AsteroidController {

    private final AsteroidService asteroidService;

    public AsteroidController(AsteroidService asteroidService) {
        this.asteroidService = asteroidService;
    }

    @GetMapping
    public List<Asteroid> getAsteroids(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
    ) {
        if (start == null && end == null) {
            return asteroidService.getCurrentWeek();
        }
        if (start == null || end == null) {
            throw new IllegalArgumentException("Both start and end must be provided together");
        }
        return asteroidService.getByDateRange(start, end);
    }

    @GetMapping("/week")
    public List<Asteroid> getCurrentWeek() {
        return asteroidService.getCurrentWeek();
    }
}
