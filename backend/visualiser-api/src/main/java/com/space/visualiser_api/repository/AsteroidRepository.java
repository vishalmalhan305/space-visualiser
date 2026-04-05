package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.Asteroid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AsteroidRepository extends JpaRepository<Asteroid, String> {
}
