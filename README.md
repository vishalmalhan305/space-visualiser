# 🌌 Space Data Visualiser

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![AWS](https://img.shields.io/badge/AWS-Fargate-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)

A portfolio-grade NASA data platform that transforms raw astronomical data from 8+ NASA APIs into interactive 3D visualizations, data-rich charts, and AI-generated insights. Built to demonstrate production-ready full-stack engineering, cloud architecture, and high-performance data pipelines.

## 🚀 Key Features

- **Real-time Orbital Mechanics:** 3D asteroid orbit visualizer using Three.js and Keplerian elements.
- **AI-Powered Insights:** Plain-language explanations of solar flares and space weather events via Anthropic Claude.
- **Mars Exploration Hub:** High-resolution photo gallery from Curiosity, Opportunity, and Spirit rovers with multi-point filtering.
- **ISS Telemetry Mapping:** Live tracking of the International Space Station with global coordinate mapping.
- **Space Weather Dashboard:** Interactive charts for solar activity and geomagnetic storm tracking.
- **High-Performance Caching:** Multi-layered Redis cache-aside implementation ensuring <100ms p95 latency.
- **Non-blocking Ingestion:** Concurrent scheduled pipelines fetching and normalizing multi-source NASA data.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS 4
- **State & Data Fetching:** TanStack React Query (auto-refetching for live telemetry)
- **Visualisation:** Three.js (3D Orbits), D3.js (Exoplanet scatter plots), Recharts (Time-series charts)
- **Mapping:** Leaflet.js
- **Testing:** Vitest + React Testing Library

### Backend
- **Framework:** Spring Boot 4.1.0-M4 (Java 21)
- **Data Access:** Spring Data JPA + Hibernate
- **Networking:** Spring WebClient (Non-blocking concurrent API calls)
- **Rate Limiting:** Bucket4j (Token-bucket per IP)
- **Migrations:** Flyway
- **Testing:** JUnit 5, Mockito, Testcontainers

### Infrastructure & Data
- **Primary Database:** PostgreSQL 16
- **Caching:** Redis 7
- **Deployment:** AWS ECS Fargate, RDS, ElastiCache
- **CI/CD:** GitHub Actions (Automated test -> Docker build -> ECS deploy)
- **Containerization:** Docker multi-stage builds

---

## 🚦 Prerequisites

Before you begin, ensure you have the following installed:
- **Java 21** (Required for backend)
- **Node.js 20+** (Required for frontend)
- **Docker Desktop** (For PostgreSQL and Redis)
- **NASA API Key** ([Get one here](https://api.nasa.gov/))
- **Anthropic API Key** (Optional, for AI explanations)

---

## 📦 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/vishalmalhan305/space-visualiser.git
cd space-visualiser
```

### 2. Environment Configuration
Copy the template and fill in your NASA API key:
```bash
cp env.example .env
```
Ensure your `NASA_API_KEY` is set in the `.env` file.

### 3. Spin up Infrastructure
Use Docker to start PostgreSQL and Redis:
```bash
docker compose up -d
```
*Note: PostgreSQL is mapped to host port **5433** to avoid conflicts with local instances.*

### 4. Setup Backend
```bash
cd backend/visualiser-api
./mvnw spring-boot:run
```
The API will be available at `http://localhost:8080`.

### 5. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Architecture

### Directory Structure
```text
.
├── backend/
│   └── visualiser-api/
│       ├── src/main/java/.../controller/  # REST Endpoints
│       ├── src/main/java/.../entity/      # JPA Models
│       ├── src/main/java/.../repository/  # Database access
│       ├── src/main/java/.../service/     # Business logic
│       ├── src/main/java/.../ingestion/   # Scheduled NASA pulls
│       └── src/main/resources/db/migration/ # Flyway SQL files
├── frontend/
│   ├── src/api/                           # API client definitions
│   ├── src/components/                    # Reusable React components
│   ├── src/hooks/                         # Custom data hooks (React Query)
│   ├── src/pages/                         # Main page views
│   └── src/types/                         # TypeScript interfaces
└── docker-compose.yml                      # Infrastructure orchestration
```

### Data Flow Pattern
1. **Background Ingestion:** Spring Scheduler triggers `IngestionJob`s -> `WebClient` fetches NASA JSON -> Data is normalized and persisted to PostgreSQL.
2. **User Request:** React SPA calls REST endpoint -> Backend checks Redis cache (Cache-Aside) -> On MISS, queries PostgreSQL and hydrates Redis -> Returns JSON.

---

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NASA_API_KEY` | Your NASA Open API Key | `DEMO_KEY` |
| `ANTHROPIC_API_KEY` | API Key for Claude AI explanations | - |
| `POSTGRES_PORT` | Host port for PostgreSQL | `5433` |
| `REDIS_PORT` | Host port for Redis | `6379` |
| `BACKEND_PORT` | Spring Boot application port | `8080` |

---

## 🧪 Testing

### Backend (JUnit 5 + Testcontainers)
```bash
cd backend/visualiser-api
./mvnw test
```
*Tested paths:* Ingestion idempotency, cache-aside logic, and REST controllers.

### Frontend (Vitest)
```bash
cd frontend
npm run test
```
*Tested components:* UI rendering, formatting utilities, and API hook states.

---

## 🚀 Deployment

The project is designed for **AWS ECS Fargate**.
1. **CI:** GitHub Actions triggers on push to `main`.
2. **Build:** Docker images are built and pushed to AWS ECR.
3. **Deploy:** ECS task definition is updated, triggering a rolling deployment.
4. **Data:** RDS (PostgreSQL) and ElastiCache (Redis) instances are assumed in the VPC.

---

## 📂 Design Standards & Rules

To maintain high code quality, this project adheres to specific standards:
- **[Codebase Details](./CODEBASE_SUMMARY.md):** Full technical deep-dive.
- **[Development Rules](./DEVELOPMENT_RULES.md):** Git conventions and coding patterns.
- **[Design Decisions](./DESIGN_DECISIONS.md):** Rationale behind architectural choices.

---

## 📝 License
This project is open-source and available under the MIT License.

*Built by [Vishal Malhan](https://github.com/vishalmalhan305).*