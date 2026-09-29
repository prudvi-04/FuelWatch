package com.fuelwatch.controller;

import com.fuelwatch.dto.Requests;
import com.fuelwatch.dto.Responses;
import com.fuelwatch.service.FuelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
public class RuleController {

    private final FuelService fuelService;

    // GET /api/rules
    @GetMapping
    public Responses.AlertRuleResponse getRule() {
        return fuelService.getRule();
    }

    // PUT /api/rules
    @PutMapping
    public Responses.AlertRuleResponse updateRule(@Valid @RequestBody Requests.AlertRuleRequest req) {
        return fuelService.updateRule(req);
    }
}
