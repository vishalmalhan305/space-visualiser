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

## DD-005: Anthropic Claude API for Explanations
**Status:** Accepted  
**Date:** 2026-04-08

### Context
Users need plain-language explanations for complex astronomical events (solar flares, asteroid orbits).

### Decision
Use **Anthropic Claude API (Haiku model)**.

### Rationale
- **Quality:** Superior reasoning and conversational tone for scientific data.
- **Cost-Effective:** The Haiku model provides high speed and low cost, perfect for a portfolio project.
- **Caching:** Explained events are cached for 24 hours to further optimize costs.
