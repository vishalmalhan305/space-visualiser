package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.SpaceWeatherEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpaceWeatherEventRepository extends JpaRepository<SpaceWeatherEvent, String> {
}
