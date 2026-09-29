package com.fuelwatch.repository;

import com.fuelwatch.entity.LevelReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LevelReadingRepository extends JpaRepository<LevelReading, Long> {
    List<LevelReading> findTop2ByGenIdOrderByTsDesc(String genId);

    // All readings for a generator within a time range, ordered ascending for chart
    List<LevelReading> findByGenIdAndTsBetweenOrderByTsAsc(String genId, LocalDateTime from, LocalDateTime to);

    // Readings since a point in time (used by FuelService.detectDrops)
    List<LevelReading> findByGenIdAndTsAfterOrderByTsAsc(String genId, LocalDateTime from);

    // Latest single reading per generator (for current level display)
    Optional<LevelReading> findTopByGenIdOrderByTsDesc(String genId);

    // Manual entries only (for operator log)
    List<LevelReading> findByGenIdAndManualTrueOrderByTsDesc(String genId);

    // All manual entries across all generators, newest first
    List<LevelReading> findByManualTrueOrderByTsDesc();

    // Refuel detection: find readings where level rose sharply
    // Uses a self-join via subquery — handled in FuelService for simplicity
    @Query("SELECT r FROM LevelReading r WHERE r.genId = :genId AND r.ts >= :from ORDER BY r.ts ASC")
    List<LevelReading> findForRefuelDetection(@Param("genId") String genId, @Param("from") LocalDateTime from);
}
