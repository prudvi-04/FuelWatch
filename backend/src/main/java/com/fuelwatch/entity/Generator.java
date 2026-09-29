package com.fuelwatch.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "generators",
        indexes = {@Index(name = "idx_gen_user", columnList = "user_id")})
@IdClass(Generator.GenKey.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Generator {

    @Id
    @Column(length = 20)
    private String id;

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotBlank
    @Column(length = 100, nullable = false)
    private String location;

    @Positive
    @Column(name = "capacity_l", nullable = false)
    private Integer capacityL;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() { this.createdAt = LocalDateTime.now(); }

    // Composite key class
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenKey implements Serializable {
        private String id;
        private Long userId;
    }
}