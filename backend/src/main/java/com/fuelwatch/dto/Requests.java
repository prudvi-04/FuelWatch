package com.fuelwatch.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Requests {

    @Data
    public static class GeneratorRequest {
        @NotBlank @Size(max = 20)
        private String id;
        @NotBlank @Size(max = 100)
        private String location;
        @NotNull @Positive
        private Integer capacityL;
    }

    @Data
    public static class ReadingRequest {
        @NotNull
        @DecimalMin("0.00") @DecimalMax("100.00")
        private BigDecimal levelPct;
        private boolean manual = true;
        @Size(max = 255)
        private String note;
        private LocalDateTime ts;
    }

    @Data
    public static class AlertRuleRequest {
        @NotNull @DecimalMin("0") @DecimalMax("100")
        private BigDecimal minLevel;
        @NotNull @DecimalMin("0") @DecimalMax("100")
        private BigDecimal dropRate;
        @NotNull @Min(1) @Max(72)
        private Integer cooldownHrs;
    }
}
