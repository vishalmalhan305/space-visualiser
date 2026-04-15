-- Composite index for hazardous filter and date sorting
CREATE INDEX idx_asteroids_hazardous_date ON asteroids(is_potentially_hazardous, close_approach_date);

-- Index for date range queries (if not already covered by composite prefix)
CREATE INDEX idx_asteroids_close_approach_date ON asteroids(close_approach_date);

-- Index for velocity and miss distance sorting
CREATE INDEX idx_asteroids_velocity ON asteroids(velocity_kmh);
CREATE INDEX idx_asteroids_miss_distance ON asteroids(miss_distance_km);
