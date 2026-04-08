package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.Asteroid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface AsteroidRepository extends JpaRepository<Asteroid, String> {

    List<Asteroid> findByCloseApproachDateBetweenOrderByCloseApproachDateAsc(
            LocalDate start,
            LocalDate end
    );

    Page<Asteroid> findByPotentiallyHazardous(boolean potentiallyHazardous, Pageable pageable);
}
