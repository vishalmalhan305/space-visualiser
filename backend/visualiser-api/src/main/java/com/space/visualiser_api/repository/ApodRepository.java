package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.ApodEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ApodRepository extends JpaRepository<ApodEntry, java.time.LocalDate> {

    List<ApodEntry> findByDateBetweenOrderByDateAsc(LocalDate start, LocalDate end);
}
