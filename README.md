# Space Data Visualiser

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![AWS](https://img.shields.io/badge/AWS-Fargate-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)

A portfolio-grade NASA data platform that transforms raw astronomical data from 8+ NASA APIs into interactive 3D visualizations, data-rich charts, and AI-generated insights. Built to demonstrate production-ready full-stack engineering, cloud architecture, and high-performance data pipelines.

## Key Features

- **Real-time Orbital Mechanics:** 3D asteroid orbit visualizer using Three.js and Keplerian elements.
- **NEO Ledger:** Paginated, filterable, and sortable asteroid table at `/asteroids` with date-range filtering, hazard flag toggle, and inline 3D orbit preview.
- **AI-Powered Insights:** Plain-language explanations of APOD images, asteroid close approaches, solar events, and exoplanets via Google Gemini 2.5 Flash.
- **Exoplanet Explorer:** Interactive D3.js scatter plot of 5,500+ confirmed exoplanets with a stats bar, category highlights, click-to-select detail panel, and AI planet briefing.
- **Mars Exploration Hub:** High-resolution masonry photo gallery from Curiosity, Opportunity, and Spirit rovers with multi-point filtering, mission banner, and photo detail panel.
- **ISS Telemetry Mapping:** Live tracking of the International Space Station with global coordinate mapping.
- **Space Weather Dashboard:** Interactive charts for solar activity and geomagnetic storm tracking.
- **High-Performance Caching:** Multi-layered Redis cache-aside implementation ensuring <100ms p95 latency.
- **Non-blocking Ingestion:** Concurrent scheduled pipelines fetching and normalizing multi-source NASA data.

---

## Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite 8 (proxies `/api/*` to `:8080` in dev)
- **Styling:** Tailwind CSS 4
- **State & Data Fetching:** TanStack React Query v5 (auto-refetching for live telemetry)
- **Animations:** Framer Motion
- **Notifications:** Sonner (toast)
- **Visualisation:** Three.js (3D orbits), D3.js (Exoplanet scatter plots), Recharts (Time-series charts)
- **Mapping:** Leaflet.js
- **Testing:** Vitest + React Testing Library

### Backend
- **Framework:** Spring Boot 4.1 (Java 21)
- **Data Access:** Spring Data JPA + Hibernate
- **Networking:** Spring WebClient (Non-blocking concurrent API calls)
- **Rate Limiting:** Bucket4j (Token-bucket per IP, 100 req/min)
- **Migrations:** Flyway (V1–V12)
- **Testing:** JUnit 5, Mockito, Testcontainers

### Infrastructure & Data
- **Primary Database:** PostgreSQL 16
- **Caching:** Redis 7
- **Deployment:** AWS ECS Fargate, RDS, ElastiCache
- **CI/CD:** GitHub Actions (Automated test → Docker build → ECS deploy)
- **Containerization:** Docker multi-stage builds

---

## Prerequisites

Before you begin, ensure you have the following installed:
- **Java 21** (Required for backend)
- **Node.js 20+** (Required for frontend)
- **Docker Desktop** (For PostgreSQL and Redis)
- **NASA API Key** ([Get one here](https://api.nasa.gov/))
- **Google Gemini API Key** (Optional, for AI explanations — `GEMINI_API_KEY`)

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/vishalmalhan305/space-visualiser.git
cd space-visualiser
```

### 2. Environment Configuration
```bash
cp env.example .env
# Fill in NASA_API_KEY (required) and GEMINI_API_KEY (optional)
```

### 3. Spin up Infrastructure
```bash
docker compose up -d
```
PostgreSQL is mapped to host port **5433** to avoid conflicts with local instances.

### 4. Start the Backend
```bash
cd backend/visualiser-api
./mvnw spring-boot:run
```
API available at `http://localhost:8080`.

### 5. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Architecture

### Routes
| Path | Page | Description |
|------|------|-------------|
| `/` | Dashboard | APOD hero, asteroid tracker, ISS map, solar weather, APOD archive |
| `/asteroids` | NEO Ledger | Paginated asteroid table with sort, filter, date range, hazard toggle, and orbit modal |
| `/mars` | Mars Gallery | Masonry photo gallery from Curiosity, Opportunity, Spirit with camera/sol filters |
| `/solar` | Solar Mission | Solar event timeline with Recharts activity charts |
| `/exoplanets` | Exoplanet Explorer | D3.js scatter plot with stats bar, category highlights, AI briefing panel |

### Directory Structure
```text
.
├── backend/
│   └── visualiser-api/
│       ├── src/main/java/.../controller/     # REST Endpoints
│       ├── src/main/java/.../entity/         # JPA Models
│       ├── src/main/java/.../repository/     # Database access (Spring Data)
│       ├── src/main/java/.../service/        # Business logic + cache-aside
│       ├── src/main/java/.../visualiser/
│       │   └── ingestion/                    # Scheduled NASA ingestion jobs
│       └── src/main/resources/db/migration/  # Flyway SQL migrations (V1–V12)
├── frontend/
│   ├── src/api/                              # Axios client + endpoint constants
│   ├── src/components/                       # UI components (apod/, dashboard/, mars/, layout/, ExoplanetXxx)
│   ├── src/hooks/                            # React Query hooks per data type
│   ├── src/pages/                            # Page views (AsteroidDetailPage, MarsPhotosPage, etc.)
│   ├── src/types/                            # TypeScript interfaces for all API responses
│   └── src/visualisers/                      # D3.js / Three.js canvas components
└── docker-compose.yml
```

### Data Flow
1. **Background Ingestion:** Spring Scheduler triggers `IngestionJob`s → `WebClient` fetches NASA JSON → Data is normalized and persisted to PostgreSQL.
2. **User Request:** React SPA calls REST endpoint → Backend checks Redis cache (Cache-Aside) → On MISS, queries PostgreSQL and hydrates Redis → Returns JSON.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NASA_API_KEY` | Your NASA Open API Key | `DEMO_KEY` |
| `GEMINI_API_KEY` | Google Gemini API key for AI explanations | — |
| `POSTGRES_PORT` | Host port for PostgreSQL | `5433` |
| `REDIS_PORT` | Host port for Redis | `6379` |
| `BACKEND_PORT` | Spring Boot application port | `8080` |

---

## Testing

### Backend (JUnit 5 + Testcontainers)
```bash
cd backend/visualiser-api
./mvnw test          # unit + integration tests
./mvnw verify        # tests + Checkstyle (Google Java Style, 100-char line limit)
```

### Frontend (Vitest + React Testing Library)
```bash
cd frontend
npm run test
```

---

## Deployment

The project targets **AWS ECS Fargate**:
1. **CI:** GitHub Actions triggers on push to `main`
2. **Build:** Docker images built and pushed to AWS ECR
3. **Deploy:** ECS task definition updated, rolling deployment initiated
4. **Data:** RDS (PostgreSQL) and ElastiCache (Redis) in the same VPC

---

## Standards & Design Docs

- **[Codebase Details](./CODEBASE_SUMMARY.md):** Technical deep-dive into all components
- **[Development Rules](./DEVELOPMENT_RULES.md):** Git conventions and coding patterns
- **[Design Decisions](./DESIGN_DECISIONS.md):** Rationale behind architectural choices
- **[CI Setup Guide](./CI_SETUP_GUIDE.md):** GitHub Actions workflow documentation

---

## License
MIT License. Built by [Vishal Malhan](https://github.com/vishalmalhan305).
