package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.MarsPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// [NEW] MarsPhotoRepository.java
@Repository
public interface MarsPhotoRepository extends JpaRepository<MarsPhoto, Long> {

    /**
     * Fetches photos based on specific rover, camera, and sol parameters.
     * This query must be optimized with the composite index (rover, camera, sol).
     */
    List<MarsPhoto> findByRoverAndCameraAndSol(String rover, String camera, Integer sol);

    List<MarsPhoto> findByRoverAndSol(String rover, Integer sol);
}
