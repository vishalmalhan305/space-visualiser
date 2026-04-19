package com.space.visualiser_api.visualiser.ingestion;

import org.postgresql.copy.CopyManager;
import org.postgresql.jdbc.PgConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.sql.SQLException;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class ExoplanetCsvIngestionJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExoplanetCsvIngestionJob.class);
    private static final String TAP_QUERY =
            "SELECT pl_name,hostname,pl_orbper,pl_rade,pl_masse,discoverymethod,disc_year,st_teff"
            + " FROM pscomppars";
    private static final int BATCH_SIZE = 500;

    private final WebClient tapWebClient;
    private final DataSource dataSource;
    private final StringRedisTemplate redisTemplate;

    public ExoplanetCsvIngestionJob(
            @Qualifier("tapWebClient") WebClient tapWebClient,
            DataSource dataSource,
            StringRedisTemplate redisTemplate
    ) {
        this.tapWebClient = tapWebClient;
        this.dataSource = dataSource;
        this.redisTemplate = redisTemplate;
    }

    @Async
    public void ingest() {
        LOGGER.info("Exoplanet ingestion started");
        long start = System.currentTimeMillis();

        String csv = tapWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("query", TAP_QUERY)
                        .queryParam("format", "csv")
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (csv == null || csv.isBlank()) {
            LOGGER.error("NASA TAP returned empty response — aborting ingestion");
            return;
        }

        int totalLoaded = bulkLoad(csv);

        evictCache();

        long elapsed = System.currentTimeMillis() - start;
        LOGGER.info("Exoplanet ingestion complete: {} rows in {}ms", totalLoaded, elapsed);
    }

    private int bulkLoad(String csv) {
        try (BufferedReader reader = new BufferedReader(new StringReader(csv))) {
            String header = reader.readLine();
            if (header == null) {
                return 0;
            }
            String[] columns = header.split(",");
            int idxPlName = indexOf(columns, "pl_name");
            int idxHostname = indexOf(columns, "hostname");
            int idxOrbper = indexOf(columns, "pl_orbper");
            int idxRade = indexOf(columns, "pl_rade");
            int idxMasse = indexOf(columns, "pl_masse");
            int idxMethod = indexOf(columns, "discoverymethod");
            int idxYear = indexOf(columns, "disc_year");
            int idxTeff = indexOf(columns, "st_teff");

            try (Connection conn = dataSource.getConnection()) {
                PgConnection pgConn = conn.unwrap(PgConnection.class);
                CopyManager copyManager = pgConn.getCopyAPI();

                truncateTable(conn);

                List<String> batch = new ArrayList<>(BATCH_SIZE);
                String line;
                int total = 0;

                while ((line = reader.readLine()) != null) {
                    String[] fields = parseCsvLine(line);
                    if (fields.length <= idxPlName || fields[idxPlName].isBlank()) {
                        continue;
                    }

                    String plName = escapeCsv(fields[idxPlName]);
                    String hostname = safeGet(fields, idxHostname);
                    String orbper = safeGet(fields, idxOrbper);
                    String rade = safeGet(fields, idxRade);
                    String masse = safeGet(fields, idxMasse);
                    String method = escapeCsv(safeGet(fields, idxMethod));
                    String year = safeGet(fields, idxYear);
                    String teff = safeGet(fields, idxTeff);
                    String ingestedAt = LocalDateTime.now(ZoneOffset.UTC).toString();

                    batch.add(String.join(",", plName, hostname, orbper, rade, masse, method, year, teff, ingestedAt));

                    if (batch.size() >= BATCH_SIZE) {
                        total += flushBatch(copyManager, batch);
                        batch.clear();
                        if (total % 1000 == 0) {
                            LOGGER.info("Ingested {} exoplanets so far", total);
                        }
                    }
                }

                if (!batch.isEmpty()) {
                    total += flushBatch(copyManager, batch);
                }

                return total;
            }
        } catch (Exception exception) {
            LOGGER.error("Exoplanet bulk load failed", exception);
            throw new IllegalStateException("Exoplanet ingestion failed", exception);
        }
    }

    private void truncateTable(Connection conn) throws Exception {
        try (var stmt = conn.createStatement()) {
            stmt.execute("TRUNCATE TABLE exoplanets");
        }
    }

    private int flushBatch(CopyManager copyManager, List<String> batch) throws IOException, SQLException {
        StringBuilder sb = new StringBuilder();
        for (String row : batch) {
            sb.append(row).append('\n');
        }
        copyManager.copyIn(
                "COPY exoplanets(pl_name,hostname,pl_orbper,pl_rade,pl_masse,discoverymethod,disc_year,st_teff,ingested_at)"
                + " FROM STDIN WITH (FORMAT CSV, NULL '')",
                new StringReader(sb.toString())
        );
        return batch.size();
    }

    private void evictCache() {
        try {
            redisTemplate.delete("exoplanets:all");
            Set<String> detailKeys = redisTemplate.keys("exoplanets:detail:*");
            if (detailKeys != null && !detailKeys.isEmpty()) {
                redisTemplate.delete(detailKeys);
            }
            LOGGER.info("Evicted exoplanet Redis cache keys");
        } catch (RuntimeException exception) {
            LOGGER.warn("Failed to evict exoplanet cache keys", exception);
        }
    }

    private int indexOf(String[] columns, String name) {
        for (int i = 0; i < columns.length; i++) {
            if (columns[i].trim().equalsIgnoreCase(name)) {
                return i;
            }
        }
        return -1;
    }

    private String safeGet(String[] fields, int idx) {
        if (idx < 0 || idx >= fields.length) {
            return "";
        }
        return fields[idx].trim();
    }

    private String escapeCsv(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }
}
