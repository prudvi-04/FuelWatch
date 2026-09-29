package com.fuelwatch.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "alert_rules")
@Data
@NoArgsConstructor
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "min_level", nullable = false, precision = 5, scale = 2)
    private BigDecimal minLevel = new BigDecimal("20.00");

    @Column(name = "drop_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal dropRate = new BigDecimal("5.00");

    @Column(name = "cooldown_hrs", nullable = false)
    private Integer cooldownHrs = 2;
}
