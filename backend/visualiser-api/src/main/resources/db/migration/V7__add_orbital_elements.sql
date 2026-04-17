-- Add full Keplerian orbital elements required for 3D trajectory computation
ALTER TABLE asteroids
    ADD COLUMN IF NOT EXISTS ascending_node_longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS perihelion_argument      DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS mean_anomaly             DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS epoch_osculation         DOUBLE PRECISION;
