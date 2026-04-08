package com.space.visualiser_api.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.space.visualiser_api.entity.SpaceWeatherEvent;
import com.space.visualiser_api.entity.SpaceWeatherEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpaceWeatherEventRepository extends JpaRepository<SpaceWeatherEvent, String> {

    List<SpaceWeatherEvent> findByStartTimeGreaterThanEqualOrderByStartTimeDesc(
            LocalDateTime startTime
    );

    Page<SpaceWeatherEvent> findByType(SpaceWeatherEventType type, Pageable pageable);


    @Query("""
            select YEAR(e.startTime) as year, MONTH(e.startTime) as month, COUNT(e) as count
            from SpaceWeatherEvent e
            where e.startTime is not null
              and e.startTime >= :fromDate
            group by YEAR(e.startTime), MONTH(e.startTime)
            order by YEAR(e.startTime), MONTH(e.startTime)
            """)
    List<MonthlyEventCountProjection> countMonthlyFrom(@Param("fromDate") LocalDateTime fromDate);

    interface MonthlyEventCountProjection {
        Integer getYear();

        Integer getMonth();

        Long getCount();
    }
}
