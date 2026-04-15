# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space Data Visualiser is a NASA data platform with a React SPA frontend and Spring Boot REST API backend. The backend ingests data from 8+ NASA APIs on cron schedules, caches with Redis, and persists to PostgreSQL. The frontend renders the data with 3D visualizations (Three.js), charts (D3.js, Recharts), and maps (Leaflet).

Architecture is a **deliberate layered monolith** (not microservices) — one Spring Boot process owns all controllers, services, ingestion jobs, and caching.

---

## Development Setup

**Prerequisites:** Docker, Java 21, Node.js 20+

```bash
cp env.example .env        # fill in NASA_API_KEY (required), ANTHROPIC_API_KEY (optional)
docker compose up -d       # PostgreSQL on :5433, Redis on :6379
```

**Backend:**
```bash
cd backend/visualiser-api
./mvnw spring-boot:run     # starts on :8080
./mvnw test                # JUnit 5 + Testcontainers (requires Docker)
./mvnw verify              # tests + Checkstyle
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                # Vite dev server on :5173
npm run build              # TypeScript check + production build
npm run test               # Vitest
npm run lint               # ESLint
```

---

## Architecture

### Frontend → Backend Communication

Vite proxies `/api/*` to `http://localhost:8080` during development (`vite.config.ts`). In production, `VITE_API_BASE_URL` env var controls the API base. All API calls go through:

- `src/api/client.ts` — Axios instance
- `src/api/endpoints.ts` — Centralized endpoint strings (APOD, ASTEROIDS, WEATHER, ISS, MARS)
- `src/hooks/` — Custom TanStack React Query hooks wrapping each endpoint

### Backend Data Flow

**Ingestion (write path):**
```
Spring Scheduler (cron)
→ WebClient (non-blocking NASA API fetch)
→ DTO deserialization
→ Idempotent upsert via JPA (natural keys: neoId, date, etc.)
→ PostgreSQL (source of truth)
```

Scheduled jobs and their cron schedules:
- `NeoWsIngestionJob` — `0 10 0 * * *` (daily), 7-day asteroid window
- `ApodIngestionJob` — `0 5 0 * * *` (daily), today's photo
- `DonkiIngestionJob` — `0 0 */6 * * *` (every 6h), solar events

**Request (read path):**
```
React Query (useQuery)
→ Axios REST call
→ Spring Boot controller
→ Service: check Redis (Cache-Aside)
    → HIT: return immediately
    → MISS: query PostgreSQL → write to Redis → return
```

**Cache TTLs:** APOD 24h, asteroids/weather 6h, ISS 5s, Mars photos 7 days. Cache keys follow `{resource}:{identifier}:{filter}` pattern.

### Backend Package Structure

All backend code is under `com.space.visualiser_api`:
- `controller/` — REST endpoints (`/api/apod`, `/api/asteroids`, `/api/weather`, `/api/mars`, `/api/iss`)
- `service/` — Business logic + cache-aside pattern + metrics
- `entity/` — JPA entities (Asteroid, ApodEntry, SpaceWeatherEvent, MarsPhoto, IngestionSyncState)
- `repository/` — Spring Data JPA interfaces (naming conventions only — no raw SQL)
- `job/` — Scheduled ingestion jobs
- `config/` — Redis, rate limiting (Bucket4j: 100 req/min/IP), metrics (Micrometer/Prometheus)

Database migrations are in `src/main/resources/db/migration/V{n}__{description}.sql` (Flyway).

### Frontend Structure

- `src/components/dashboard/` — Main dashboard components (AsteroidTracker, ApodHero, IssTracker, etc.)
- `src/hooks/` — React Query hooks per data type
- `src/types/` — TypeScript interfaces for all API responses (strict, no `any`)
- `src/api/` — Axios client + endpoint constants
- Routing: `/` → Dashboard, `/mars` → MarsPhotosPage

Key dependencies: Three.js (3D orbits), D3.js (scatter plots), Recharts (time series), Leaflet (ISS map), Framer Motion (animations).

---

## Code Conventions

**Backend:**
- Lombok: `@Data`, `@RequiredArgsConstructor`, `@Slf4j` on all service/entity classes
- Constructor injection only — no field-level `@Autowired`
- JPA/JPQL only — no raw SQL in repositories
- Specific exception types, never catch `Exception` generically
- Checkstyle is enforced by `./mvnw verify`

**Frontend:**
- `strict: true` TypeScript — no `any` types
- All API response shapes defined as interfaces in `src/types/`
- Server state exclusively via React Query (no Redux/Zustand)
- No `console.log` in committed code

**Git branches:** `main`, `develop`, `feature/{name}`, `fix/{name}`, `chore/{name}`
**Commits:** `<type>: <subject>` — types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

---

## Key Config Files

| File | Purpose |
|------|---------|
| `env.example` | All environment variables with defaults |
| `docker-compose.yml` | PostgreSQL + Redis local setup |
| `backend/visualiser-api/src/main/resources/application.yml` | Spring datasource, Redis, cache TTLs, scheduler config |
| `frontend/vite.config.ts` | Dev proxy (`/api` → `:8080`), Vitest config |
| `frontend/src/api/endpoints.ts` | All API endpoint strings (single source of truth) |

---

## Testing

**Backend integration tests** use Testcontainers (real PostgreSQL containers spun up per test class). Test fixtures (real NASA JSON responses) live in `src/test/resources/fixtures/`. Docker must be running.

**Frontend tests** use Vitest + jsdom + React Testing Library. Run a single test file:
```bash
npm run test -- src/components/dashboard/AsteroidTracker.test.tsx
```

**Load testing:** `load-test.js` at repo root uses k6. Target: p95 < 100ms for cached endpoints under 200 concurrent users.

---

## Observability

- Prometheus metrics: `GET /actuator/prometheus`
- Custom metrics: `spaceCacheHitsCounter`, `spaceCacheMissesCounter`, `asteroidQueryTimer`
- Cache hit/miss logs at DEBUG; ingestion job outcomes at INFO/ERROR
