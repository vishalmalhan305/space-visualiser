CREATE TABLE exoplanets (
    pl_name          VARCHAR(200) PRIMARY KEY,
    hostname         VARCHAR(200),
    pl_orbper        DOUBLE PRECISION,
    pl_rade          DOUBLE PRECISION,
    pl_masse         DOUBLE PRECISION,
    discoverymethod  VARCHAR(100),
    disc_year        INTEGER,
    st_teff          DOUBLE PRECISION,
    ingested_at      TIMESTAMP NOT NULL
);

CREATE INDEX idx_exoplanets_method ON exoplanets (discoverymethod);
CREATE INDEX idx_exoplanets_year   ON exoplanets (disc_year);
