package com.fuelwatch.controller;

import com.fuelwatch.dto.Responses;
import com.fuelwatch.service.FuelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final FuelService fuelService;

    // GET /api/alerts              → unresolved alerts
    // GET /api/alerts?all=true     → last 30 days
    @GetMapping
    public List<Responses.AlertResponse> getAlerts(
            @RequestParam(defaultValue = "false") boolean all) {
        return fuelService.getAllAlerts(all);
    }

    // PUT /api/alerts/{id}/resolve
    @PutMapping("/{id}/resolve")
    public Responses.AlertResponse resolve(@PathVariable Long id) {
        return fuelService.resolveAlert(id);
    }
}
