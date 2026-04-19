package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.Exoplanet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExoplanetRepository extends JpaRepository<Exoplanet, String> {
}
