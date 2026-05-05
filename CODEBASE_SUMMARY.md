# Space Data Visualiser — Codebase Summary

---

## Project Identity

**What is this?**
A full-stack NASA data platform that transforms raw space data from 8+ NASA APIs into interactive experiences. Users explore real-time asteroid close approaches, solar flares, Mars rover photos, ISS positioning, and exoplanets through 3D visualizations, interactive charts, and AI-generated plain-language explanations.

**Why does it exist?**
This is a **portfolio-grade demonstration project** showcasing:
- Data engineering (scheduled ingestion pipelines)
- Cloud architecture (AWS ECS + RDS + ElastiCache)
- Caching strategies (Redis cache-aside pattern)
- AI integration (Google Gemini 2.5 Flash)
- 3D visualization (Three.js orbital mechanics)
- Production practices (CI/CD, monitoring, rate limiting)

**Who is it for?**
1. **Primary:** Hiring managers and technical interviewers at Canadian tech companies (Shopify, Wealthsimple, FreshBooks, etc.)
2. **Secondary:** Space enthusiasts who want to explore NASA data interactively

---

## Architecture at a Glance

### System Design Pattern
**Layered monolith** with separate SPA frontend. Deliberately NOT microservices — easier to deploy, debug, and demonstrate in interviews.

### Two Core Data Flows

**1. Scheduled Ingestion Pipeline (background)**
```
Spring Scheduler (cron)
  → WebClient (non-blocking NASA API calls)
  → JSON/CSV deserialization
  → Data normalization
  → JPA repository (idempotent upsert)
  → PostgreSQL
```

**2. Request-Response Flow (user-facing)**
```
React SPA
  → Spring Boot REST controller
  → Redis cache check
    → CACHE HIT: return immediately (<5ms)
    → CACHE MISS: query PostgreSQL → cache result → return
```

### Component Map

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 19 + TypeScript + Vite 8 | All UI, calls Spring Boot API |
| **Backend API** | Spring Boot 4.1 / Java 21 | REST endpoints, business logic |
| **Ingestion** | Spring Scheduler + WebClient | Scheduled NASA API pulls |
| **Cache Layer** | Redis 7 | Cache-aside pattern, TTL-based invalidation |
| **Database** | PostgreSQL 16 | Persistent storage for all space data |
| **AI Service** | Google Gemini 2.5 Flash | Plain-English explanations for APOD, asteroids, solar events, exoplanets |
| **CI/CD** | GitHub Actions | Automated test → build → deploy |
| **Monitoring** | Prometheus (Micrometer) + CloudWatch | Metrics, logs, alarms |

---

## Tech Stack Deep Dive

### Frontend
- **React 19 + TypeScript + Vite 8** — Fast HMR, compile-time safety
- **Tailwind CSS 4** — Dark space theme, consistent spacing
- **TanStack React Query v5** — Server state, auto-refetch for live ISS position
- **Framer Motion** — Cinematic page transitions, scroll reveals, animated loaders
- **Sonner** — Toast notifications (e.g. AI explanation loaded, copy-to-clipboard)
- **Three.js** — 3D asteroid orbit visualizer
- **D3.js** — Exoplanet scatter plot (5,500+ planets, filterable by discovery method)
- **Recharts** — Historical solar activity time series
- **Leaflet.js** — Live ISS world map

### Backend
- **Spring Boot 4.1 / Java 21** — Industry standard in Canada
- **Spring Scheduler** — Cron-based NASA API ingestion
- **Spring WebClient** — Non-blocking concurrent API calls
- **Spring Data JPA** — Repository pattern, idempotent writes
- **Bucket4j** — Token-bucket rate limiter (100 req/min per IP)
- **Flyway** — Versioned schema migrations (V1–V12)

### Data Layer
- **PostgreSQL 16** — ACID guarantees, date-range queries, indexing
- **Redis 7** — Sub-millisecond cache, TTL support (5s for ISS, 24h for APOD)

### Cloud & DevOps
- **AWS ECS Fargate** — Containerized Spring Boot, stateless design
- **AWS RDS** — Managed PostgreSQL (t3.micro, automated backups)
- **AWS ElastiCache** — Managed Redis (t3.micro)
- **AWS CloudWatch** — Logs, metrics, alarms for ingestion failures
- **Vercel** — React SPA hosting
- **GitHub Actions** — CI/CD pipeline (PR checks → Docker build → ECS deploy)
- **Docker** — Multi-stage builds for Spring Boot

### AI & APIs
- **Google Gemini 2.5 Flash** — AI explanations for APOD, asteroids, solar events, and exoplanets (24h cache)
- **8+ NASA APIs** — APOD, NeoWs, DONKI, Mars Rovers, ISS, Exoplanet Archive TAP API

---

## Frontend Structure

### Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Dashboard` (inline in App.tsx) | APOD hero, live intel grid (asteroids/solar/ISS), APOD archive |
| `/asteroids` | `AsteroidDetailPage` | Paginated NEO ledger: sort, filter, date range, hazard toggle, 3D orbit modal |
| `/mars` | `MarsPhotosPage` | Masonry photo gallery (Curiosity/Opportunity/Spirit), filters, detail panel |
| `/solar` | `SolarMissionPage` | Solar event timeline, Recharts activity charts |
| `/exoplanets` | `ExoplanetExplorer` (lazy-loaded) | D3.js scatter plot, stats bar, category highlights, detail panel with AI briefing |

### Component Tree

```
src/components/
├── apod/
│   ├── ApodHero.tsx           — Today's APOD with AI explanation
│   ├── ApodArchive.tsx        — Scrollable APOD history grid
│   └── ApodSkeleton.tsx       — Loading placeholder
├── dashboard/
│   ├── AsteroidTracker.tsx    — Weekly NEO summary table
│   ├── IssTracker.tsx         — Live ISS map (Leaflet)
│   ├── OrbitModal.tsx         — Three.js 3D orbit renderer (modal)
│   ├── SolarWeatherWidget.tsx — Recent solar event summary
│   └── StatusBar.tsx          — Live system status bar
├── mars/
│   ├── MarsFilters.tsx        — Rover/camera/sol filter controls
│   ├── MarsMasonryGrid.tsx    — CSS masonry photo layout
│   ├── MarsMissionBanner.tsx  — Rover mission header banner
│   └── MarsPhotoDetailPanel.tsx — Slide-in photo detail view
├── layout/
│   ├── Navbar.tsx             — Top navigation with route links
│   └── Reveal.tsx             — Framer Motion scroll-reveal wrapper
├── ExoplanetDetailPanel.tsx   — Slide-in exoplanet detail with AI briefing
├── ExoplanetSidebar.tsx       — Filter/legend sidebar for scatter plot
└── ExoplanetStatsBar.tsx      — Aggregate stats (count, avg radius, etc.)

src/visualisers/
├── ExoplanetChart.tsx         — D3.js scatter plot (orbital period vs. radius)
└── OrbitVisualiser.tsx        — Three.js Keplerian orbit renderer
```

### Hooks

| Hook | Endpoint | Notes |
|------|----------|-------|
| `useApod` | `/api/apod/today`, `/api/apod/archive` | Fetches today's and archive APOD |
| `useAsteroids` | `/api/asteroids/week` | Weekly NEO summary |
| `useAsteroidsPaginated` | `/api/asteroids/page` | Paginated ledger with sort/filter params |
| `useIssPosition` | `/api/iss/position` | Refetches every 5s |
| `useWeather` | `/api/weather/recent` | Recent solar events |
| `useWeatherPaginated` | `/api/weather/page` | Paginated solar event history |
| `useMarsPhotos` | `/api/mars/photos` | Filtered by rover param |
| `useExoplanets` | `/api/exoplanets` | Full dataset (fetched once, cached 12h) |
| `useExoplanetDetail` | `/api/exoplanets/{plName}` | Single exoplanet detail |
| `useAiExplain` | `/api/ai/explain` | AI explanation (type + id param) |

---

## Backend Structure

### Ingestion Jobs

| Job | Cron | Data |
|-----|------|------|
| `NeoWsIngestionJob` | `0 10 0 * * *` | Asteroid close approaches (7-day window) |
| `ApodIngestionJob` | `0 5 0 * * *` | Astronomy Picture of the Day |
| `DonkiIngestionJob` | `0 0 */6 * * *` | Solar events (flares, geomagnetic storms) |
| `ExoplanetCsvIngestionJob` | On-demand | 5,500+ exoplanets via NASA TAP API (CSV) |
| `NeoWsStartupSeeder` | On startup | Seeds 30-day asteroid backfill if DB empty |
| `ApodStartupSeeder` | On startup | Seeds recent APOD entries if DB empty |

### Database Schema (Flyway Migrations)

| Migration | Table / Change |
|-----------|----------------|
| V1 | `apod_entries` |
| V2 | `asteroids` |
| V3 | `space_weather_events` |
| V4 | `ingestion_sync_state` |
| V5 | `mars_photos` |
| V6 | Composite index on asteroids |
| V7 | Orbital elements columns on asteroids |
| V8 | `ai_explanations` |
| V9 | `exoplanets` |
| V10 | Nullable camera/sol on mars_photos |
| V11 | `title` column on mars_photos |
| V12 | `description`, `keywords` columns on mars_photos |

### REST API Endpoints

**APOD**
- `GET /api/apod/today` — Today's APOD
- `GET /api/apod?date={date}` — Specific date
- `GET /api/apod/range?start={date}&end={date}` — Date range
- `GET /api/apod/archive?count={n}` — Recent N entries

**Asteroids**
- `GET /api/asteroids/week` — Current 7-day window
- `GET /api/asteroids/{neoId}` — Single asteroid details
- `GET /api/asteroids/{neoId}/orbit` — 3D orbital elements for Three.js
- `GET /api/asteroids/page` — Paginated, sortable, filterable ledger

**Space Weather**
- `GET /api/weather/recent?days={n}` — Last N days of events
- `GET /api/weather/page` — Paginated event history

**Mars**
- `GET /api/mars/photos?rover={r}&camera={c}&sol={s}` — Filterable photo gallery

**ISS**
- `GET /api/iss/position` — Live lat/lng (5s cache)

**Exoplanets**
- `GET /api/exoplanets` — Full dataset (12h cache)
- `GET /api/exoplanets/{plName}` — Single exoplanet detail
- `POST /api/admin/exoplanets/ingest` — Trigger CSV ingestion

**AI**
- `GET /api/ai/explain?type={t}&id={id}` — AI explanation (24h cache)
  - `type=asteroid` — fetches Asteroid by neoId, builds orbital data prompt
  - `type=apod` — fetches ApodEntry by date, includes title and NASA explanation
  - `type=exoplanet` — fetches Exoplanet by name, includes radius, mass, orbital period, host star
  - Other types — generic fallback prompt

**Actuator**
- `GET /actuator/health` — ECS health probe
- `GET /actuator/prometheus` — Prometheus scrape endpoint

---

## Redis Cache Key Design

| Cache Key | TTL | Rationale |
|-----------|-----|-----------|
| `apod:{date}` | 24h | APOD updates once daily |
| `asteroids:week:{year}-W{week}` | 6h | New NEO data arrives daily |
| `weather:events:{date}` | 6h | DONKI events ingested every 6h |
| `iss:position` | 5s | ISS moves continuously |
| `mars:photos:{rover}:{camera}:sol:{sol}` | 7 days | Historical photos never change |
| `ai:explain:{event_type}:{event_id}` | 24h | Same entity shouldn't re-cost an LLM call |
| `exoplanets:all` | 12h | Dataset updated infrequently |

**Cache-aside pattern:** Check Redis → HIT: return immediately → MISS: query PostgreSQL → store in Redis → return.

---

## Testing Strategy

### Backend
- **Unit tests (JUnit 5 + Mockito):** Service layer — `ApodServiceTest`, `AsteroidServiceTest`, `IssServiceTest`, `MarsServiceTest`, `SpaceWeatherServiceTest`, `AiExplanationServiceTest`
- **Ingestion tests:** `NeoWsIngestionJobTest` — mocks WebClient with real NASA JSON fixture, verifies idempotency
- **Controller tests:** `AsteroidControllerTest`, `MarsControllerTest` — full HTTP layer via `@WebMvcTest`
- **Integration tests:** Testcontainers for real PostgreSQL (no H2)
- Test fixtures (real NASA JSON) in `src/test/resources/fixtures/`

### Frontend
- **Vitest + React Testing Library:** `AsteroidTracker.test.tsx`
- Run a single file: `npm run test -- src/components/dashboard/AsteroidTracker.test.tsx`

### Load Testing
- `load-test.js` at repo root uses k6
- Target: p95 < 100ms for cached endpoints under 200 concurrent users

---

## Performance Targets

| KPI | Target |
|-----|--------|
| Cache hit rate (NASA data) | ≥90% |
| p95 API latency (cached) | <100ms |
| Ingestion pipeline success rate | ≥99% |
| AI explanation cache hit rate | ≥80% |
| Frontend Lighthouse score | ≥90 |

---

## Security

- Rate limiting: 100 req/min per IP via Bucket4j
- No raw SQL — JPA parameterized queries only
- API keys via environment variables (AWS Secrets Manager in production)
- `.env` files in `.gitignore` — never committed
- PostgreSQL not publicly accessible (VPC security group)
