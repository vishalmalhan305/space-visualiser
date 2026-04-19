package com.space.visualiser_api.controller;

import com.space.visualiser_api.service.ExoplanetService;
import com.space.visualiser_api.visualiser.dto.ExoplanetDetailDto;
import com.space.visualiser_api.visualiser.dto.ExoplanetSummaryDto;
import com.space.visualiser_api.visualiser.ingestion.ExoplanetCsvIngestionJob;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class ExoplanetController {

    private final ExoplanetService exoplanetService;
    private final ExoplanetCsvIngestionJob ingestionJob;

    public ExoplanetController(ExoplanetService exoplanetService, ExoplanetCsvIngestionJob ingestionJob) {
        this.exoplanetService = exoplanetService;
        this.ingestionJob = ingestionJob;
    }

    @GetMapping("/api/exoplanets")
    public List<ExoplanetSummaryDto> getAll() {
        return exoplanetService.getAll();
    }

    @GetMapping("/api/exoplanets/{plName}")
    public ExoplanetDetailDto getDetail(@PathVariable String plName) {
        return exoplanetService.getDetail(plName);
    }

    @PostMapping("/api/admin/exoplanets/ingest")
    public ResponseEntity<Map<String, String>> triggerIngest() {
        ingestionJob.ingest();
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("status", "ingestion started"));
    }
}
