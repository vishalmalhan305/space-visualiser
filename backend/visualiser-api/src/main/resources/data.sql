INSERT INTO space_weather_events (event_id, type, start_time, peak_time, class_type, source_location, link)
VALUES
    ('2026-04-01-FLR-001', 'FLARE', '2026-04-01 10:00:00', '2026-04-01 10:15:00', 'X1.2', 'AR13664', 'https://example.nasa.gov/flare1'),
    ('2026-04-02-CME-001', 'CME', '2026-04-02 14:30:00', NULL, 'Partial Halo', 'NW Limb', 'https://example.nasa.gov/cme1'),
    ('2026-04-03-GST-001', 'GST', '2026-04-03 05:00:00', '2026-04-03 12:00:00', 'G3', NULL, 'https://example.nasa.gov/storm1')
    ON CONFLICT (event_id) DO NOTHING;