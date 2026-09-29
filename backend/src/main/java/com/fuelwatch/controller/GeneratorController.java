package com.fuelwatch.controller;

import com.fuelwatch.dto.Requests;
import com.fuelwatch.dto.Responses;
import com.fuelwatch.service.FuelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/generators")
@RequiredArgsConstructor
public class GeneratorController {

    private final FuelService fuelService;

    // GET /api/generators
    @GetMapping
    public List<Responses.GeneratorResponse> getAll() {
        return fuelService.getAllGenerators();
    }

    // GET /api/generators/{id}
    @GetMapping("/{id}")
    public Responses.GeneratorResponse getOne(@PathVariable String id) {
        return fuelService.getGenerator(id);
    }

    // POST /api/generators
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Responses.GeneratorResponse create(@Valid @RequestBody Requests.GeneratorRequest req) {
        return fuelService.createGenerator(req);
    }

    // DELETE /api/generators/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        fuelService.deleteGenerator(id);
    }

    // GET /api/generators/{id}/readings?from=...&to=...
    @GetMapping("/{id}/readings")
    public List<Responses.ReadingResponse> getReadings(
            @PathVariable String id,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime to) {
        LocalDateTime start = from != null ? from : LocalDateTime.now().minusYears(1);
        LocalDateTime end   = to   != null ? to   : LocalDateTime.now().plusDays(1);
        return fuelService.getReadings(id, start, end);
    }

    // POST /api/generators/{id}/readings
    @PostMapping("/{id}/readings")
    @ResponseStatus(HttpStatus.CREATED)
    public Responses.ReadingResponse logReading(
            @PathVariable String id,
            @Valid @RequestBody Requests.ReadingRequest req) {
        return fuelService.logReading(id, req);
    }

    // GET /api/generators/{id}/refuels?from=...
    @GetMapping("/{id}/refuels")
    public List<Responses.RefuelEventResponse> getRefuels(
            @PathVariable String id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from) {
        return fuelService.getRefuelEvents(id, from);
    }

    // POST /api/generators/{id}/detect  — manual trigger
    @PostMapping("/{id}/detect")
    public List<Responses.AlertResponse> triggerDetection(@PathVariable String id) {
        return fuelService.detectDrops(id);
    }
}
