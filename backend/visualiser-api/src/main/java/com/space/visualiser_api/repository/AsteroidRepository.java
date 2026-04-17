package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.Asteroid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AsteroidRepository extends JpaRepository<Asteroid, String> {

    List<Asteroid> findByCloseApproachDateBetweenOrderByCloseApproachDateAsc(
            LocalDate start,
            LocalDate end
    );

    Page<Asteroid> findByPotentiallyHazardous(boolean potentiallyHazardous, Pageable pageable);

    java.util.Optional<Asteroid> findFirstByNeoId(String neoId);

    @Query("SELECT a FROM Asteroid a WHERE " +
           "(:hazardous IS NULL OR a.potentiallyHazardous = :hazardous) AND " +
           "(:start IS NULL OR a.closeApproachDate >= :start) AND " +
           "(:end IS NULL OR a.closeApproachDate <= :end)")
    Page<Asteroid> findWithFilters(
            @Param("hazardous") Boolean hazardous,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            Pageable pageable
    );
}
