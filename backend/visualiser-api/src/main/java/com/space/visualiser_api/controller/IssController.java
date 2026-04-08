package com.space.visualiser_api.controller;

import com.space.visualiser_api.controller.dto.IssPositionDto;
import com.space.visualiser_api.service.IssService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/iss")
public class IssController {

    private final IssService issService;

    public IssController(IssService issService) {
        this.issService = issService;
    }

    @GetMapping("/position")
    public IssPositionDto getPosition() {
        IssPositionDto position = issService.getCurrentPosition();
        if (position == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "ISS Telemetry is currently unavailable from external sources"
            );
        }
        return position;
    }
}
