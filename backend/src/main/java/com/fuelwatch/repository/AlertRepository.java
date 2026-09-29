package com.fuelwatch.repository;

import com.fuelwatch.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    void deleteByIdAndGenId(Long id, String genId);

    // Used by detectDrops — blocks if ANY alert (resolved or not) fired recently
    boolean existsByGenIdAndTypeAndTsAfter(String genId, Alert.AlertType type, LocalDateTime after);

    // Used by evaluateCurrentLevels — only blocks if UNRESOLVED alert exists
    List<Alert> findByGenIdOrderByTsDesc(String genId);
    // Unresolved alerts — what the dashboard shows
    List<Alert> findByResolvedFalseOrderByTsDesc();

    // Unresolved alerts for one generator
    List<Alert> findByGenIdAndResolvedFalseOrderByTsDesc(String genId);

    // All alerts within a window (for 7-day count)
    List<Alert> findByTsAfterOrderByTsDesc(LocalDateTime from);

    // Check if alert already fired recently (cooldown enforcement)
    boolean existsByGenIdAndTypeAndResolvedFalseAndTsAfter(String genId, Alert.AlertType type, LocalDateTime after);
}
