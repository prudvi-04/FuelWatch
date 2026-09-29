package com.fuelwatch.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts", indexes = {
    @Index(name = "idx_alert_gen_ts", columnList = "gen_id, ts")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gen_id", length = 20, nullable = false)
    private String genId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertType type;

    @Column(precision = 5, scale = 2)
    private BigDecimal value;

    @Column(nullable = false)
    private LocalDateTime ts;

    @Column(nullable = false)
    private boolean resolved = false;

    public enum AlertType {
        LOW_LEVEL, SUDDEN_DROP
    }
}
