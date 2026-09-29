package com.fuelwatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FuelWatchApplication {
    public static void main(String[] args) {
        SpringApplication.run(FuelWatchApplication.class, args);
    }
}
