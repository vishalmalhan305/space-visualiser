# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space Data Visualiser is a NASA data platform with a React 19 SPA frontend and Spring Boot 4.1 REST API backend. The backend ingests data from 8+ NASA APIs on cron schedules, caches with Redis, and persists to PostgreSQL. The frontend renders the data with 3D visualizations (Three.js), charts (D3.js, Recharts), and maps (Leaflet).

Architecture is a **deliberate layered monolith** — one Spring Boot process owns all controllers, services, ingestion jobs, and caching. Do not suggest microservices.

---

## Development Setup

**Prerequisites:** Docker, Java 21, Node.js 20+

```bash
cp env.example .env        # fill in NASA_API_KEY (required), GEMINI_API_KEY (optional)
docker compose up -d       # PostgreSQL on :5433, Redis on :6379
```

**Backend:**
```bash
cd backend/visualiser-api
./mvnw spring-boot:run     # starts on :8080
./mvnw test                # JUnit 5 + Testcontainers (requires Docker)
./mvnw verify              # tests + Checkstyle (Google Java Style, 100-char line limit)
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                # Vite 8 dev server on :5173
npm run build              # TypeScript check + production build
npm run test               # Vitest
npm run lint               # ESLint
```

---

## Architecture

### Frontend → Backend Communication

Vite proxies `/api/*` to `http://localhost:8080` during development (`vite.config.ts`). In production, `VITE_API_BASE_URL` env var controls the API base. All API calls go through:

- `src/api/client.ts` — Axios instance
- `src/api/endpoints.ts` — Centralized endpoint strings (single source of truth)
- `src/hooks/` — Custom TanStack React Query v5 hooks wrapping each endpoint

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
- `ExoplanetCsvIngestionJob` — on-demand CSV ingest from NASA Exoplanet Archive TAP API

**Request (read path):**
```
React Query (useQuery)
→ Axios REST call
→ Spring Boot controller
→ Service: check Redis (Cache-Aside)
    → HIT: return immediately
    → MISS: query PostgreSQL → write to Redis → return
```

**Cache TTLs:** APOD 24h, asteroids/weather 6h, ISS 5s, Mars photos 7 days, exoplanets 12h, AI explanations 24h. Cache keys follow `{resource}:{identifier}:{filter}` pattern.

### Backend Package Structure

All backend code is under `com.space.visualiser_api`:
- `controller/` — REST endpoints (`/api/apod`, `/api/asteroids`, `/api/weather`, `/api/mars`, `/api/iss`, `/api/exoplanets`, `/api/ai`)
- `service/` — Business logic + cache-aside pattern + metrics
- `entity/` — JPA entities (Asteroid, ApodEntry, SpaceWeatherEvent, MarsPhoto, Exoplanet, IngestionSyncState)
- `repository/` — Spring Data JPA interfaces (naming conventions only — no raw SQL or `@Query`)
- `visualiser/ingestion/` — Scheduled ingestion jobs (and `ExoplanetCsvIngestionJob`)
- `visualiser/dto/` — DTOs for API responses (e.g., `ExoplanetSummaryDto`, `ExoplanetDetailDto`)
- `config/` — Redis, rate limiting (Bucket4j: 100 req/min/IP), metrics (Micrometer/Prometheus)

Database migrations are in `src/main/resources/db/migration/V{n}__{description}.sql` (Flyway). Never edit an existing migration — always create a new one.

### Frontend Structure

- `src/components/dashboard/` — Main dashboard components
- `src/pages/` — Page-level views (`ExoplanetExplorer`, `MarsPhotosPage`, `SolarMissionControl`)
- `src/hooks/` — React Query hooks per data type
- `src/types/` — TypeScript interfaces for all API responses (strict, no `any`)
- `src/api/` — Axios client + endpoint constants
- Routing: `/` → Dashboard, `/mars` → MarsPhotosPage, `/solar` → SolarMissionControl, `/exoplanets` → ExoplanetExplorer

Key dependencies: Three.js (3D orbits), D3.js (exoplanet scatter plots), Recharts (time series), Leaflet (ISS map), Framer Motion (animations).

---

## Code Conventions

**Backend:**
- Lombok: `@Data`, `@RequiredArgsConstructor`, `@Slf4j` on all service/entity classes
- Constructor injection only — no field-level `@Autowired`
- JPA/JPQL only — no raw SQL in repositories
- Specific exception types, never catch `Exception` generically
- Checkstyle is enforced by `./mvnw verify` (Google Java Style, 100-char line limit, 150-line method limit)
- Log cache hits at DEBUG, ingestion outcomes at INFO/ERROR

**Frontend:**
- `strict: true` TypeScript — no `any` types
- All API response shapes defined as interfaces in `src/types/`
- Server state exclusively via React Query (no Redux/Zustand)
- No `console.log` in committed code
- All images must have `alt` tags; verify no CSS overflow at 375px mobile width

**Git branches:** `main`, `develop`, `feature/{name}`, `fix/{name}`, `chore/{name}`
**Commits:** `<type>: <subject>` — types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

---

## AI Explanation Service

`AiExplanationService` calls **Google Gemini 2.5 Flash** (`app.gemini.api-key` / `GEMINI_API_KEY`). The prompt is built by looking up real entity data from the DB:

- `type=asteroid` → fetches `Asteroid` by `neoId`, builds a prompt with name, diameter, approach date, distance, velocity, hazard status
- `type=apod` → fetches `ApodEntry` by date, builds a prompt with title, date, and NASA explanation text
- Other types → generic fallback prompt

Responses are cached in Redis for 24h (`ai:explain:{type}:{id}`) and persisted as audit records in `AiExplanation` table.

---

## Key Config Files

| File | Purpose |
|------|---------|
| `env.example` | All environment variables with defaults |
| `docker-compose.yml` | PostgreSQL + Redis local setup |
| `backend/visualiser-api/src/main/resources/application.yml` | Spring datasource, Redis, cache TTLs, Gemini config, scheduler |
| `frontend/vite.config.ts` | Dev proxy (`/api` → `:8080`), Vitest config |
| `frontend/src/api/endpoints.ts` | All API endpoint strings (single source of truth) |
| `backend/visualiser-api/checkstyle.xml` | Checkstyle rules (Google Java Style) |
| `.github/workflows/pr-checks.yml` | CI: tests + Checkstyle + build on every push |

---

## Testing

**Backend integration tests** use Testcontainers (real PostgreSQL containers per test class). Test fixtures (real NASA JSON responses) live in `src/test/resources/fixtures/`. Docker must be running.

Test naming convention: `methodName_scenario_expectedBehavior`

Mock only external dependencies (WebClient, Gemini API) — never mock your own services. Integration tests must use Testcontainers, not H2.

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
