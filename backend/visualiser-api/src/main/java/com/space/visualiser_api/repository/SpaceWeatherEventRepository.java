package com.space.visualiser_api.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.space.visualiser_api.entity.SpaceWeatherEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpaceWeatherEventRepository extends JpaRepository<SpaceWeatherEvent, String> {

    List<SpaceWeatherEvent> findByStartTimeGreaterThanEqualOrderByStartTimeDesc(
            LocalDateTime startTime
    );
}
