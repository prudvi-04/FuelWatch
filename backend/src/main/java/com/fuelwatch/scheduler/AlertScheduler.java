package com.fuelwatch.scheduler;

import com.fuelwatch.service.FuelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AlertScheduler {

    private final FuelService fuelService;

    // Runs every 30 minutes — scans all generators for alert conditions
    //@Scheduled(fixedDelayString = "1800000", initialDelay = 60000)
    public void runAlertScan() {
        log.info("Running scheduled alert scan...");
        try {
            fuelService.detectDropsAllGenerators();
        } catch (Exception e) {
            log.error("Alert scan failed: {}", e.getMessage());
        }
    }
}
