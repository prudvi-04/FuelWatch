package com.fuelwatch.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Responses {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class GeneratorResponse {
        private String id;
        private String location;
        private Integer capacityL;
        private BigDecimal currentLevel;
        private String status;           // OK | WARNING | CRITICAL | NO_DATA
        private LocalDateTime lastReadingAt;
        private int activeAlerts;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReadingResponse {
        private Long id;
        private String genId;
        private BigDecimal levelPct;
        private boolean manual;
        private String note;
        private LocalDateTime ts;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AlertResponse {
        private Long id;
        private String genId;
        private String type;
        private BigDecimal value;
        private LocalDateTime ts;
        private boolean resolved;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AlertRuleResponse {
        private Integer id;
        private BigDecimal minLevel;
        private BigDecimal dropRate;
        private Integer cooldownHrs;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RefuelEventResponse {
        private String genId;
        private BigDecimal fromLevel;
        private BigDecimal toLevel;
        private BigDecimal rise;
        private LocalDateTime ts;
    }
}
