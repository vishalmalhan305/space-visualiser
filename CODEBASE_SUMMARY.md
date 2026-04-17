# Space Data Visualiser — Codebase Summary

---

## Project Identity

**What is this?**  
A full-stack NASA data platform that transforms raw space data from 8+ NASA APIs into beautiful, interactive experiences. Users explore real-time asteroid close approaches, solar flares, Mars rover photos, ISS positioning, and exoplanets through 3D visualizations, interactive charts, and AI-generated plain-language explanations.

**Why does it exist?**  
This is a **portfolio-grade demonstration project** for a Canadian full-stack developer role. It showcases:
- Data engineering (scheduled ingestion pipelines)
- Cloud architecture (AWS ECS + RDS + ElastiCache)
- Caching strategies (Redis cache-aside pattern)
- AI integration (Claude/OpenAI API for event explanations)
- 3D visualization (Three.js orbital mechanics)
- Production practices (CI/CD, monitoring, rate limiting, IaC)

**Who is it for?**
1. **Primary:** Hiring managers and technical interviewers at Canadian tech companies (Shopify, Wealthsimple, FreshBooks, etc.)
2. **Secondary:** Space enthusiasts and curious users who want to explore NASA data interactively

---

## Architecture at a Glance

### System Design Pattern
**Layered monolith** with separate SPA frontend. Deliberately NOT microservices at this scale — easier to deploy, debug, and demonstrate in interviews.

### Two Core Data Flows

**1. Scheduled Ingestion Pipeline (background)**
```
Spring Scheduler (cron) 
  → WebClient (non-blocking NASA API calls)
  → JSON deserialization 
  → Data normalization 
  → JPA repository 
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
| **Frontend** | React 18 + TypeScript + Vite | All UI, calls Spring Boot API |
| **Backend API** | Spring Boot 3 / Java 21 | REST endpoints, business logic |
| **Ingestion** | Spring Scheduler + WebClient | Scheduled NASA API pulls |
| **Cache Layer** | Redis 7 | Cache-aside pattern, TTL-based invalidation |
| **Database** | PostgreSQL 16 | Persistent storage for all space data |
| **AI Service** | Gemini API | Plain-English event explanations |
| **Alerts** | AWS SES | Email notifications for space events |
| **CI/CD** | GitHub Actions | Automated test → build → deploy |
| **Monitoring** | CloudWatch + Prometheus | Metrics, logs, alarms |

---

## Tech Stack Deep Dive

### Frontend
- **React 18 + TypeScript + Vite** — Fast HMR, compile-time safety for orbital calculations
- **Tailwind CSS** — Dark space theme, consistent spacing
- **React Query (TanStack)** — Auto-refetch for live ISS position
- **Three.js** — 3D asteroid orbit visualizer (~150 lines)
- **D3.js** — Exoplanet scatter plot (5,500+ planets)
- **Recharts** — Historical solar activity time series
- **Leaflet.js** — Live ISS world map

### Backend
- **Spring Boot 3 / Java 21** — Industry standard in Canada
- **Spring Scheduler** — Cron-based NASA API ingestion
- **Spring WebClient** — Non-blocking concurrent API calls
- **Spring Data JPA** — Repository pattern, idempotent writes
- **Spring Security** — JWT, OAuth, rate limiting
- **Bucket4j** — Token-bucket rate limiter (100 req/min per IP)
- **Flyway** — Versioned schema migrations

### Data Layer
- **PostgreSQL 16** — ACID guarantees, date-range queries, indexing
- **Redis 7** — Sub-millisecond cache, TTL support (5s for ISS, 24h for APOD)
- **Flyway migrations** — Schema versioning from V1__create_apod.sql onward

### Cloud & DevOps
- **AWS ECS Fargate** — Containerized Spring Boot, stateless design
- **AWS RDS** — Managed PostgreSQL (t3.micro, automated backups)
- **AWS ElastiCache** — Managed Redis (t3.micro)
- **AWS SES** — Email alerts ($0.10/1,000 emails)
- **AWS Secrets Manager** — API keys (NASA, Claude)
- **AWS CloudWatch** — Logs, metrics, alarms for ingestion failures
- **Vercel** — React SPA hosting (zero-config deployment)
- **GitHub Actions** — CI/CD pipeline (PR checks → Docker build → ECS deploy)
- **Docker** — Multi-stage builds for Spring Boot

### AI & APIs
- **Anthropic Claude API** — Haiku model for event explanations (fast, cheap)
- **8+ NASA APIs** — APOD, NeoWs, DONKI, Mars Rovers, ISS, EPIC, Exoplanet Archive
- **Open Notify API** — Live ISS position (no key required)


## Redis Cache Key Design

**The caching detail interviewers probe most.** Cache keys are hierarchical and deterministic — same request always produces same key.

| Cache Key | TTL | Rationale |
|-----------|-----|-----------|
| `apod:{date}` | 24h | APOD updates once daily; yesterday's entry never changes |
| `asteroids:week:{year}-W{week}` | 6h | New NEO data arrives daily; short TTL ensures freshness |
| `weather:events:{date}` | 6h | DONKI events ingested every 6h; TTL matches cadence |
| `iss:position` | 5s | ISS moves continuously; cache reduces calls but stays nearly live |
| `mars:photos:{rover}:{camera}:sol:{sol}` | 7 days | Historical photos never change once published |
| `ai:explain:{event_type}:{event_id}` | 24h | Same flare shouldn't re-cost an LLM API call |
| `exoplanets:all` | 12h | Dataset updated infrequently; long TTL acceptable |

**Cache-aside pattern:** Check Redis first → if HIT return immediately → if MISS query PostgreSQL → store in Redis → return.

---

## REST API Endpoints

### APOD
- `GET /api/apod/today` — Today's APOD
- `GET /api/apod?date={date}` — Specific date
- `GET /api/apod/range?start={date}&end={date}` — Date range

### Asteroids
- `GET /api/asteroids/week` — Current 7-day window
- `GET /api/asteroids/{neoId}` — Single asteroid details
- `GET /api/asteroids/{neoId}/orbit` — 3D orbital elements for Three.js

### Space Weather
- `GET /api/weather/recent?days={n}` — Last N days of events
- `GET /api/weather/stats/monthly` — Historical chart data (2015–present)

### Mars
- `GET /api/mars/photos?rover={r}&camera={c}&sol={s}` — Filterable photo gallery

### ISS
- `GET /api/iss/position` — Live lat/lng (5s cache)

### Earth
- `GET /api/earth/images?date={date}` — EPIC full-disc Earth images

### Exoplanets
- `GET /api/exoplanets` — Full dataset (paginated, filterable)

### AI
- `GET /api/ai/explain?type={t}&id={id}` — Plain-English event explanation (24h cache)

### Alerts
- `POST /api/alerts/subscribe` — Email + alert_type + threshold
- `DELETE /api/alerts/unsubscribe?token={t}` — One-click unsubscribe

### Actuator (Monitoring)
- `GET /actuator/health` — ECS target group health probe
- `GET /actuator/metrics` — Micrometer metrics
- `GET /actuator/prometheus` — Prometheus scrape endpoint

### API Docs
- `GET /swagger-ui.html` — Auto-generated OpenAPI docs

---

## Key Design Decisions

### Why a scheduled pull architecture over webhooks?
NASA doesn't offer webhooks. Pull architecture means designing for eventual consistency and TTL-based cache invalidation. **Interview talking point:** "I designed for a world where the data source doesn't notify me — this meant thinking carefully about cache expiry and stale data tolerance."

### Why Spring WebClient over RestTemplate?
**Non-blocking NASA API calls** allow the ingestion pipeline to fetch 8 endpoints **concurrently** instead of sequentially, halving total pipeline runtime. WebClient returns Mono/Flux (reactive types), enabling parallel composition.

### Why cache-aside over write-through?
Data is only cached on first read, not on every write. Simpler to implement and avoids caching data that is never requested. For example, asteroid data from 2 years ago may never be queried — no point pre-warming the cache.

### Why PostgreSQL over MongoDB?
Relational model is correct here:
- Clear entity relationships (asteroids → close_approach_date, events → start_time)
- Date-range queries with indexes
- ACID guarantees for idempotent writes (INSERT OR UPDATE on natural keys)
- Strong typing prevents malformed NASA JSON from corrupting the DB

### Why Redis TTL matches ingestion cadence?
APOD: ingested daily → 24h cache. DONKI: ingested every 6h → 6h cache. ISS: moves continuously → 5s cache. **The cache TTL should reflect the data's rate of change**, not an arbitrary timeout.

### Why Flyway over manual schema changes?
Schema versioning in code:
- Complete history of schema evolution
- Reproducible deployments from scratch
- Prevents "it works on my machine" schema drift
- **Interviewers recognize this as a production-grade practice**

---

## Development Workflow

### Branch Strategy
```
main (always deployable, deploys to AWS ECS on merge)
  ↑
develop (integration branch)
  ↑
feature/{name} (e.g., feature/three-js-orbit, feature/ai-explainer)
```

### Commit Convention
- `feat:` — New feature or endpoint
- `fix:` — Bug fix
- `chore:` — Project setup, tooling, config
- `docs:` — Documentation only
- `refactor:` — Code improvement, no behavior change
- `test:` — Adding or updating tests
- `ci:` — GitHub Actions pipeline changes

### Local Development Setup
```bash
# Prerequisites: Java 21 (SDKMAN), Node 20 (nvm), Docker Desktop

# Start PostgreSQL + Redis
docker compose up -d

# Backend (Spring Boot)
cd backend/visualiser-api
NASA_API_KEY=DEMO_KEY mvn spring-boot:run

# Frontend (React + Vite)
cd ../../frontend
npm install && npm run dev

# Open http://localhost:5173
```

### CI/CD Pipeline (GitHub Actions)
```
Pull Request to main/develop:
  → Run JUnit tests
  → Run npm test
  → mvn package (verify build succeeds)
  → Block merge on failure

Merge to main:
  → Build Docker image
  → Push to AWS ECR (tagged with :latest and :{git-sha})
  → Trigger ECS rolling deployment
  → CloudWatch monitors health
```

---

## Testing Strategy

### Unit Tests (JUnit 5 + Mockito)
**Target:** 60%+ line coverage on service layer

**Most important test:** `NeoWsIngestionServiceTest`
- Mocks WebClient with real NASA JSON fixture
- Verifies correct number of asteroids persisted
- Verifies duplicate prevention on re-run (idempotency)
- **This is the test to demo in interviews**

### Integration Tests (Testcontainers)
**Target:** Critical ingestion paths

Uses real PostgreSQL container via Testcontainers. Verifies full controller → service → repository → database flow.


### Load Tests (k6)
**Target:** Performance benchmark for README

Simulates 200 concurrent users hitting `/api/asteroids/week` for 60 seconds. Documents:
- p95 latency before and after Redis caching
- Throughput (requests/sec)
- Error rate

---

## Performance Targets (KPIs)

| KPI | Target | How to Measure |
|-----|--------|----------------|
| NASA API cache hit rate | ≥90% | CloudWatch custom metric |
| p95 API response latency | <100ms (cached) | k6 load test + CloudWatch |
| Ingestion pipeline success rate | ≥99% | CloudWatch alarm on failure |
| AI explanation cache hit rate | ≥80% | Redis MONITOR during testing |
| Frontend Lighthouse score | ≥90 | Chrome DevTools Lighthouse |

---

## Security & Compliance

### API Security
- NASA API keys in AWS Secrets Manager (never in code)
- Claude API key in AWS Secrets Manager
- Rate limiting: 100 req/min per IP via Bucket4j
- HTTPS enforced via AWS ALB (HTTP redirects to HTTPS)
- Input validation: Spring @RequestParam + Bean Validation

### Data Security
- No user authentication required for v1 (alerts use email only)
- Alert emails stored as plain text (no PII beyond email)
- Unsubscribe via secure UUID token (no account required)
- PostgreSQL not publicly accessible (VPC security group)
- SQL injection prevented by JPA parameterized queries

### Secrets Management
- AWS Secrets Manager for all API keys
- Environment variables injected at ECS task startup
- `.env` files in `.gitignore` — never committed
- GitHub Actions secrets for AWS credentials
