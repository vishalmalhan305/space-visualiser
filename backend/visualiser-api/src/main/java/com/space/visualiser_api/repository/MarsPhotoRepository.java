package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.MarsPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarsPhotoRepository extends JpaRepository<MarsPhoto, Long> {

    List<MarsPhoto> findByRoverIgnoreCase(String rover);
}
