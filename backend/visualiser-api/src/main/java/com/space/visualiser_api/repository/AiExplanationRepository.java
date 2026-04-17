package com.space.visualiser_api.repository;

import com.space.visualiser_api.entity.AiExplanation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiExplanationRepository extends JpaRepository<AiExplanation, Long> {
}
