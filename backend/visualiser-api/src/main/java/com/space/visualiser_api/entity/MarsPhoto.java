package com.space.visualiser_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "mars_photos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarsPhoto {

    @Id
    @Column(name = "photo_id")
    private Long photoId;

    @Column(name = "rover", nullable = false, length = 50)
    private String rover;

    @Column(name = "camera", nullable = false, length = 50)
    private String camera;

    @Column(name = "sol", nullable = false)
    private Integer sol;

    @Column(name = "earth_date", nullable = false)
    private LocalDate earthDate;

    @Column(name = "img_src", nullable = false, columnDefinition = "TEXT")
    private String imgSrc;

    @Column(name = "fetched_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime fetchedAt;
}
