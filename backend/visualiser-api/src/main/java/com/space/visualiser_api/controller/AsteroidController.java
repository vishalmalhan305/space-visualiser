package com.space.visualiser_api.controller;

import com.space.visualiser_api.visualiser.dto.AsteroidOrbitDto;
import com.space.visualiser_api.entity.Asteroid;
import com.space.visualiser_api.service.AsteroidService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;

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
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Both start and end must be provided together"
            );
        }
        return asteroidService.getByDateRange(start, end);
    }

    @GetMapping("/week")
    public List<Asteroid> getCurrentWeek() {
        return asteroidService.getCurrentWeek();
    }

    @GetMapping("/{neoId}")
    public Asteroid getByNeoId(@PathVariable String neoId) {
        return asteroidService.getByNeoId(neoId);
    }

    @GetMapping("/{neoId}/orbit")
    public AsteroidOrbitDto getOrbit(@PathVariable String neoId) {
        return asteroidService.getOrbitByNeoId(neoId);
    }

    @GetMapping("/page")
    public Page<Asteroid> getAsteroidsPage(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(required = false) Boolean hazardous,
            @RequestParam(defaultValue = "closeApproachDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        validateDateRange(start, end);
        return asteroidService.getAsteroidsPage(start, end, hazardous, sortBy, sortDir, page, size);
    }

    private void validateDateRange(LocalDate start, LocalDate end) {
        if (start != null && end != null) {
            if (start.isAfter(end)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date must be before or equal to end date");
            }
            if (java.time.temporal.ChronoUnit.DAYS.between(start, end) > 7) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date range cannot exceed 7 days");
            }
        } else if (start != null || end != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both start and end dates must be provided together");
        }
    }
}
