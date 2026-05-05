# Design Decisions — Space Data Visualiser

This document records the key architectural and design decisions made during development. Each entry includes the context, the decision made, and the rationale.

---

## DD-001: Monolith vs. Microservices
**Status:** Accepted
**Date:** 2026-04-08

### Context
The project needs to demonstrate full-stack capabilities to Canadian tech companies. It handles data ingestion from multiple NASA APIs and serves it via a React frontend.

### Decision
Implement as a **layered monolith** with a separate SPA frontend.

### Rationale
- **Simplicity:** Easier to deploy, debug, and demonstrate during a 30-60 minute interview.
- **Overhead:** Microservices would introduce unnecessary complexity (service discovery, distributed tracing, etc.) at this scale.
- **Focus:** Allows more time for high-quality code and data engineering rather than infrastructure boilerplate.

---

## DD-002: Scheduled Pull Ingestion
**Status:** Accepted
**Date:** 2026-04-08

### Context
NASA's APIs do not provide webhooks for updates.

### Decision
Use a **scheduled pull architecture** using Spring Scheduler and WebClient.

### Rationale
- **Control:** Fine-grained control over when and how data is fetched.
- **Reliability:** Simplifies handling of rate limits and API downtime via retry logic in background jobs.
- **Industry Standard:** Demonstrates proficiency with non-blocking API calls (WebClient) and scheduled tasks.

---

## DD-003: Database Choice (PostgreSQL)
**Status:** Accepted
**Date:** 2026-04-08

### Context
Space data (asteroids, solar events, missions) is highly structured and relational.

### Decision
Use **PostgreSQL 16**.

### Rationale
- **Relational Integrity:** Strong typing and ACID guarantees prevent data corruption from malformed NASA JSON.
- **Complex Queries:** Efficiently handles date-range queries and indexing for time-series data (e.g., solar activity).
- **Production Standard:** Most Canadian fintech and e-commerce companies (Shopify, Wealthsimple) rely heavily on relational databases.

---

## DD-004: Redis Cache-Aside Pattern
**Status:** Accepted
**Date:** 2026-04-08

### Context
Reducing latency for frequent requests (e.g., ISS position, today's APOD) and minimizing NASA API usage.

### Decision
Implement the **Cache-Aside pattern** using **Redis 7**.

### Rationale
- **Performance:** Sub-millisecond response times for cached data.
- **Efficiency:** Data is only cached on first read, avoiding memory bloat from rarely requested historical data.
- **Interview Talking Point:** Demonstrates understanding of caching strategies and TTL management based on data volatility.

---

## DD-005: Google Gemini API for Explanations
**Status:** Accepted (migrated from Anthropic Claude)
**Date:** 2026-04-08 (updated 2026-04-19)

### Context
Users need plain-language explanations for APOD images, asteroid close approaches, solar events, and exoplanets.

### Decision
Use **Google Gemini 2.5 Flash** (`gemini-2.5-flash` model via `generativelanguage.googleapis.com`).

### Rationale
- **Quality:** Strong reasoning and conversational tone for scientific data.
- **Cost-Effective:** Flash model provides high speed and low cost.
- **Context-Aware Prompts:** The AI explanation service looks up the real entity from the DB before building the Gemini prompt — ensuring specific, grounded responses rather than generic ones.
- **Caching:** Explained events are cached for 24h in Redis (`ai:explain:{type}:{id}`) to minimize API costs.
- **Coverage:** Supports `type=asteroid`, `type=apod`, `type=exoplanet`, and a generic fallback for other types.

---

## DD-006: Exoplanet Data via NASA TAP API (CSV Ingestion)
**Status:** Accepted
**Date:** 2026-04-19

### Context
The NASA Exoplanet Archive provides a dataset of 5,500+ confirmed exoplanets via a TAP (Table Access Protocol) endpoint, not a standard REST API.

### Decision
Ingest exoplanet data using `ExoplanetCsvIngestionJob`, which fetches ADQL query results as CSV from the NASA Exoplanet Archive TAP API and parses them into `Exoplanet` entities.

### Rationale
- **Data Source Reality:** The TAP API is the canonical access method for the Exoplanet Archive; there is no simpler REST endpoint for bulk data.
- **Infrequent Updates:** Exoplanet data changes rarely — a 12h cache TTL and on-demand ingestion trigger are appropriate.
- **D3.js Scatter Plot:** The dataset's numerical fields (radius, mass, orbital period, equilibrium temperature) map naturally to a D3.js scatter plot for visual exploration.

---

## DD-007: Mars Gallery — NASA Image Library Integration
**Status:** Accepted
**Date:** 2026-05-02

### Context
The initial Mars gallery rendered a simple flat list of rover photos. Users wanted richer metadata (titles, descriptions, keywords) and a more visually engaging layout.

### Decision
Enhance `MarsPhoto` entity with `title`, `description`, and `keywords` fields (V11, V12 migrations). Augment the gallery with a masonry grid layout (`MarsMasonryGrid`), a rover mission context banner (`MarsMissionBanner`), filter controls (`MarsFilters`), and a slide-in detail panel (`MarsPhotoDetailPanel`).

### Rationale
- **Discoverability:** Masonry layout handles variable-height images naturally and matches the aesthetic of professional photo galleries.
- **Context:** The mission banner provides rover-specific context (launch date, landing site, status) so users understand which mission produced each photo.
- **Non-breaking:** Schema changes added nullable columns via Flyway — existing data rows remain valid; new ingestion fills the new fields.

---

## DD-008: Exoplanet Explorer — Click-to-Select with AI Planet Briefing
**Status:** Accepted
**Date:** 2026-05-05

### Context
The D3.js scatter plot rendered 5,500+ points but clicking a planet showed no meaningful information. Users needed context on individual exoplanets.

### Decision
Add `ExoplanetStatsBar` (aggregate stats across the visible dataset), `ExoplanetSidebar` (filter/legend panel), and `ExoplanetDetailPanel` (slide-in detail with AI briefing). Clicking a scatter plot point fetches the full exoplanet record and triggers `useAiExplain(type='exoplanet', id=plName)`.

### Rationale
- **Engagement:** An AI briefing transforms a raw data point into a narrative — "This planet orbits a Sun-like star at 1.3 AU and was discovered by the transit method in 2019."
- **Cost Control:** AI explanations are cached 24h in Redis (`ai:explain:exoplanet:{plName}`) — selecting the same planet twice costs zero additional Gemini API calls.
- **Performance:** `ExoplanetExplorer` is lazy-loaded via `React.lazy` + `Suspense` to keep the main bundle small, since the D3.js chart and Three.js dependencies are heavy.
