# Exoplanet Archive Feature — Design Document

**Status:** Design complete. Pending implementation.  
**Date:** 2026-04-18  
**Feature branch:** `feature/exoplanet-archive`

---

## Understanding Summary

- **What:** Exoplanet Explorer feature — ingests NASA's 5,500+ confirmed planet dataset, exposes it via a two-tier REST/cache API, and renders an interactive D3 scatter plot on HTML canvas
- **Why:** Portfolio "wow" component demonstrating large-dataset ingestion (PostgreSQL COPY), advanced Redis caching (two-tier), and high-performance browser visualisation (D3 canvas)
- **Who:** Primary — hiring managers / technical interviewers at Canadian tech companies. Secondary — space enthusiasts
- **Where it fits:** Layered monolith, consistent with all existing patterns. No new framework dependencies introduced
- **Not in scope:** User-level auth for ingestion endpoint (v1 policy), real-time updates, server-side filtering

---

## Assumptions

| # | Assumption |
|---|-----------|
| 1 | Migration file is **`V9__create_exoplanets.sql`** — V6 is already taken (`V6__add_asteroid_composite_index.sql`) |
| 2 | Admin ingestion endpoint is unauthenticated in v1, consistent with "no user auth for v1" policy |
| 3 | `pl_name` is a safe natural primary key — unique across NASA's confirmed planets table |
| 4 | Summary payload (~300KB gzipped) is acceptable as a single non-paginated response |
| 5 | D3 is already installed in the frontend |
| 6 | NASA TAP endpoint is publicly accessible without an API key |

---

## Decision Log

| # | Decision | Alternatives Considered | Rationale |
|---|----------|------------------------|-----------|
| 1 | **Ingestion: PostgreSQL `COPY FROM STDIN` via JDBC** | A) `saveAll()` in chunks; C) Spring Batch | No new framework dependency; maximum throughput; strong interview talking point ("bulk load, not ORM overhead") |
| 2 | **Cache: Two-tier** (`exoplanets:all` summary + `exoplanets:detail:{pl_name}`) | A) Single full-dataset blob; B) Per-page keys | Decouples plot load from detail load; fast initial render; on-demand detail fetches are cheap |
| 3 | **Ingestion trigger: `POST /api/admin/exoplanets/ingest`** | A) On startup; B) Weekly cron | Maximum demo control — triggerable live in interviews; avoids unnecessary ingestion on every restart |
| 4 | **Canvas rendering (D3 drives `<canvas>`)** | A) SVG; C) WebGL/regl | SVG degrades beyond 2,000 nodes; WebGL is overkill and conflicts with existing Three.js context; canvas is the correct middle ground |
| 5 | **Client-side filtering (`Array.filter()` in React state)** | B) Server-side query params; C) Server pre-grouped | Zero latency on filter toggle; full dataset fits in memory; no loading states needed |
| 6 | **Stitch UI ideation before component code** | Skip Stitch | Validates color palette, layout proportions, and detail panel hierarchy before committing to code |

---

## Final Design

### 1. Database Layer

**File:** `V9__create_exoplanets.sql`

```sql
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
```

---

### 2. Ingestion Job

**File:** `src/main/java/com/space/visualiser_api/visualiser/ingestion/ExoplanetCsvIngestionJob.java`

**Data source:**
```
GET https://exoplanetarchive.ipac.caltech.edu/TAP/sync
  ?query=SELECT pl_name,hostname,pl_orbper,pl_rade,pl_masse,discoverymethod,disc_year,st_teff
         FROM pscomppars
  &format=csv
```

**Flow:**
1. WebClient streams CSV response
2. BufferedReader parses line by line → `Exoplanet` POJO
3. Batches of 500 → `COPY FROM STDIN` via `PGConnection` (unwrapped from `DataSource`)
4. Truncate-then-reload strategy (full refresh, not incremental)
5. SLF4J logs every 1,000 rows + total duration
6. On completion: evict `exoplanets:all` and all `exoplanets:detail:*` keys from Redis
7. Controller returns `202 Accepted` immediately; job runs on `@Async` executor

---

### 3. Service & Cache Layer

**File:** `ExoplanetService.java`

**DTOs:**

| `ExoplanetSummaryDto` | `ExoplanetDetailDto` |
|----------------------|---------------------|
| pl_name | pl_name |
| pl_orbper | hostname |
| pl_rade | pl_orbper |
| discoverymethod | pl_rade |
| disc_year | pl_masse |
| | discoverymethod |
| | disc_year |
| | st_teff |

**Cache keys:**

| Key | TTL | Usage |
|-----|-----|-------|
| `exoplanets:all` | 12h | Full summary list for scatter plot |
| `exoplanets:detail:{pl_name}` | 12h | Per-planet detail on hover/click |

**API endpoints:**
```
GET  /api/exoplanets              → List<ExoplanetSummaryDto>
GET  /api/exoplanets/{pl_name}    → ExoplanetDetailDto
POST /api/admin/exoplanets/ingest → 202 Accepted (async)
```

---

### 4. Frontend Components

**New files:**

```
src/
  visualisers/
    ExoplanetChart.tsx        ← D3 canvas scatter plot
  components/
    ExoplanetSidebar.tsx      ← Discovery method filter checkboxes
    ExoplanetDetailPanel.tsx  ← Selected planet info card
  hooks/
    useExoplanets.ts          ← GET /api/exoplanets (staleTime: 12h)
    useExoplanetDetail.ts     ← GET /api/exoplanets/{name} (lazy)
  pages/ or App.tsx
    ExoplanetExplorer section ← React.lazy() + <Suspense>
```

**Canvas rendering (ExoplanetChart):**
- `xScale`: `d3.scaleLog()` → Orbital Period (days)
- `yScale`: `d3.scaleLinear()` → Planet Radius (Earth radii)
- `colorScale`: `d3.scaleOrdinal()` → Discovery Method colour coding
- Axes rendered into overlay `<svg>` (not canvas) — D3 axis generators work on SVG
- Dots rendered on `<canvas>` — 3px radius circles, one paint pass per frame
- `onMouseMove`: nearest-point lookup (linear scan or `d3.quadtree`) within 8px radius
- On nearest-point found: show CSS tooltip div + trigger `useExoplanetDetail(pl_name)`

**Lazy loading:**
```tsx
const ExoplanetExplorer = React.lazy(() => import('./ExoplanetExplorer'));
// In App.tsx: <Suspense fallback={<SpaceLoader />}><ExoplanetExplorer /></Suspense>
```

---

### 5. Stitch UI Ideation (Pre-code)

Run Stitch with this prompt before writing any component code:

> *"Exoplanet Explorer dashboard section. High-contrast dark mode, mission control aesthetic. Three-column grid: left sidebar (20%) — discovery method filter checkboxes as glowing electric blue toggle pills with planet count badge per method; center (60%) — large canvas scatter plot with dark background, electric blue/purple/gold data points, D3 log-scale X-axis labeled 'Orbital Period (days)', linear Y-axis labeled 'Planet Radius (Earth Radii)'; right panel (20%) — 'Selected Planet' info card with planet name in large white type, star system, discovery year, mass, radius, stellar temperature. Top bar: title 'Exoplanet Archive' and a glowing 'Load Dataset' button."*

**Extract from Stitch:** colour hexes, spacing, typography hierarchy, glow/border treatment.  
**Translate:** Stitch HTML → React components using existing Tailwind classes. Canvas replaces static chart placeholder.

---

### 6. Verification Plan

| Layer | Test | Tool |
|-------|------|------|
| Migration | V9 applies cleanly on fresh DB | `docker compose up` + `mvn spring-boot:run` |
| Ingestion | POST returns 202, DB count reaches ~5,500 | `curl` + `psql \c` count |
| Cache | Second GET /api/exoplanets < 5ms | Redis `MONITOR` |
| Detail API | Correct fields returned per planet | HTTPie |
| Canvas render | 5,500 dots visible, 60fps | Chrome DevTools Performance |
| Hover | Tooltip within 1 frame of mouseover | Manual |
| Load test | p95 < 100ms @ 200 VUs for 60s | k6 (extend `load-test.js`) |
| Mobile | No overflow @ 375px | Chrome DevTools device toolbar |
