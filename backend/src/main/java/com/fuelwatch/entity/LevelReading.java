package com.fuelwatch.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "level_readings", indexes = {
    @Index(name = "idx_gen_ts", columnList = "gen_id, ts")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LevelReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gen_id", length = 20, nullable = false)
    private String genId;

    @DecimalMin("0.00")
    @DecimalMax("100.00")
    @Column(name = "level_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal levelPct;

    @Column(name = "is_manual", nullable = false)
    private boolean manual = false;

    @Column(length = 255)
    private String note;

    @Column(nullable = false)
    private LocalDateTime ts;

    @PrePersist
    public void prePersist() {
        if (this.ts == null) this.ts = LocalDateTime.now();
    }
}
