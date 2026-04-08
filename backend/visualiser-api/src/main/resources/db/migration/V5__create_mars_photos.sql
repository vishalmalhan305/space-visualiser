-- File: backend/visualiser-api/src/main/resources/db/migration/V5__create_mars_photos.sql
CREATE TABLE mars_photos (
    photo_id    BIGINT PRIMARY KEY,
    rover       VARCHAR(50) NOT NULL,
    camera      VARCHAR(50) NOT NULL,
    sol         INTEGER NOT NULL,
    earth_date  DATE NOT NULL,
    img_src     TEXT NOT NULL,
    fetched_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Composite index for fast filtering queries
CREATE INDEX idx_mars_photos_rover_camera_sol ON mars_photos(rover, camera, sol);
CREATE INDEX idx_mars_photos_earth_date ON mars_photos(earth_date);
