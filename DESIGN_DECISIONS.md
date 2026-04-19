# Design Decisions — Space Data Visualiser

This document records the key architectural and design decisions made during the development of the Space Data Visualiser project. Each entry includes the context, the decision made, and the rationale.

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
- **Focus:** Allows more time to focus on high-quality code and data engineering rather than infrastructure boilerplate.

---

## DD-002: Scheduled Pull Ingestion
**Status:** Accepted  
**Date:** 2026-04-08

### Context
NASA's APIs do not provide webhooks for updates.

### Decision
Use a **scheduled pull architecture** using Spring Scheduler and WebClient.

### Rationale
- **Control:** Allows fine-grained control over when and how data is fetched.
- **Reliability:** Simplifies handling of rate limits and API downtime via retry logic in background jobs.
- **Industry Standard:** Demonstrates proficiency with concurrent, non-blocking API calls (WebClient) and scheduled tasks.

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
Users need plain-language explanations for APOD images, asteroid close approaches, and solar events.

### Decision
Use **Google Gemini 2.5 Flash** (`gemini-2.5-flash` model via `generativelanguage.googleapis.com`).

### Rationale
- **Quality:** Strong reasoning and conversational tone for scientific data.
- **Cost-Effective:** Flash model provides high speed and low cost.
- **Context-Aware Prompts:** The AI explanation service looks up the real entity from the DB (title, NASA explanation, orbital data) before building the Gemini prompt — ensuring specific, grounded responses rather than generic ones.
- **Caching:** Explained events are cached for 24 hours in Redis (`ai:explain:{type}:{id}`) to minimize API costs.

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
