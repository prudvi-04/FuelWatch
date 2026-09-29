package com.fuelwatch.repository;

import com.fuelwatch.entity.Generator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneratorRepository extends JpaRepository<Generator, Generator.GenKey> {
    List<Generator> findByUserId(Long userId);
    Optional<Generator> findByIdAndUserId(String id, Long userId);
    boolean existsByIdAndUserId(String id, Long userId);
}