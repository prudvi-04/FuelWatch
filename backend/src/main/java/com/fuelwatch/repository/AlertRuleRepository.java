package com.fuelwatch.repository;

import com.fuelwatch.entity.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, Integer> {
    // Always use the first (and only) rule row
    Optional<AlertRule> findFirstByOrderByIdAsc();
}
