package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.IngestionSyncState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IngestionSyncStateRepository extends JpaRepository<IngestionSyncState, String> {
}
