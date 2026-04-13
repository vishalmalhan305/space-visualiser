# Space Data Visualiser

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.0-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![AWS](https://img.shields.io/badge/AWS-Fargate-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)

A portfolio-grade NASA data platform that transforms raw astronomical data into interactive 3D visualizations, data-rich charts, and AI-generated insights. Built to demonstrate production-ready full-stack engineering, cloud architecture, and data ingestion pipelines.

## 🚀 Overview

- **Real-time Orbital Mechanics:** 3D asteroid orbit visualizer using Three.js and Keplerian elements.
- **AI-Powered Insights:** Plain-language explanations of solar flares and space weather via Anthropic Claude.
- **High-Performance Caching:** Redis cache-aside pattern ensuring <100ms p95 latency.
- **Automated Ingestion:** Concurrent, non-blocking NASA data pipelines fetching from 8+ APIs daily.

## 🏗️ Architecture & Standards

This project follows strict architectural guardrails to ensure it meets the standards of high-growth Canadian tech companies.

- **[Codebase Summary](./CODEBASE_SUMMARY.md):** Deep dive into the architecture, system design, and component map.
- **[Development Rules](./DEVELOPMENT_RULES.md):** Non-negotiable coding standards, testing requirements, and git workflow.
- **[Design Decisions](./DESIGN_DECISIONS.md):** Log of architectural rationales (e.g., Mono vs Micro, DB choice).

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Three.js, React Query.
- **Backend:** Spring Boot 3 (Java 21), Spring Data JPA, WebClient, Bucket4j.
- **Data:** PostgreSQL 16, Redis 7, Flyway Migrations.
- **Cloud/CI:** AWS (ECS, RDS, ElastiCache), GitHub Actions, Docker.

## 🚦 Getting Started

Detailed setup instructions are available in the [Local Development Setup](./CODEBASE_SUMMARY.md#local-development-setup) section.

---

*This project was built for professional demonstration purposes. For technical inquiries, please refer to the [Verification Plan](./CODEBASE_SUMMARY.md#verification-plan).*