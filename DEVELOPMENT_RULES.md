# Development Rules — Space Data Visualiser

**Purpose:** These rules define the development standards, workflow patterns, and constraints that apply to this codebase. Any AI agent or developer working on this project must follow these rules.

---

## Identity & Context Rules

### R1: Project Identity
- This is a **portfolio demonstration project**, not production SaaS
- Primary audience: Canadian tech hiring managers (Shopify, Wealthsimple, FreshBooks, etc.)
- Every technical decision must be **explainable in an interview**
- Code quality > feature completeness — unfinished but clean code beats rushed spaghetti

### R2: Architecture Philosophy
- **Deliberately a monolith** — do NOT suggest microservices
- Favor **simplicity over cleverness** — the interviewer should understand it in 90 seconds
- Every design decision must have a documented rationale in `DESIGN_DECISIONS.md`
- When in doubt, ask: "Would I be proud to walk through this code with a senior engineer?"

### R3: Technology Constraints
**Backend:** Spring Boot 3 / Java 21 only — no Kotlin, no Scala, no alternative JVM frameworks  
**Frontend:** React 18 + TypeScript + Vite only — no Next.js, no Vue, no Angular  
**Database:** PostgreSQL 16 only — no MongoDB, no MySQL  
**Cache:** Redis 7 only — no Memcached, no embedded caching  
**Cloud:** AWS only (ECS, RDS, ElastiCache, SES) — no GCP, no Azure  
**AI:** Anthropic Claude API preferred, OpenAI acceptable fallback

**Exception:** Infrastructure-as-Code tools (Terraform) and monitoring (Prometheus/Grafana) are flexible.

---

## Code Quality Rules

### R4: TypeScript Strictness
- `strict: true` in `tsconfig.json` — non-negotiable
- No `any` types except in unavoidable third-party library integrations
- All API response types must be interfaces in `frontend/src/types/`
- Three.js orbital calculations must be strongly typed (no unsafe casts)

### R5: Java Code Standards
- Use Lombok `@Data`, `@RequiredArgsConstructor`, `@Slf4j` annotations
- All service methods throw specific exceptions, not generic `Exception`
- Constructor injection only — no field injection (`@Autowired` on fields)
- All repository methods follow Spring Data naming conventions (`findBy...`, `existsBy...`)
- No raw SQL in code — JPA or JPQL only

### R6: Code Review Checklist
Before committing any code, verify:
- [ ] No hardcoded API keys or secrets (use environment variables)
- [ ] No `System.out.println` or `console.log` in production code (use SLF4J / proper logging)
- [ ] All new endpoints documented in Swagger (`@Operation`, `@ApiResponse`)
- [ ] All new database tables have Flyway migration file
- [ ] No TODO comments without GitHub issue reference
- [ ] `.gitignore` updated if new config files added

---

## Testing Rules

### R7: Test Coverage Minimums
- Service layer: **≥60% line coverage** — measured via JaCoCo
- Controllers: **100% of REST endpoints** tested (integration or API tests)
- Critical path: **NeoWs ingestion job MUST have unit test** (architecture doc requirement)
- No tests for DTOs or entities (value objects don't need tests)

### R8: Test Data Standards
- Use **real NASA JSON fixtures** in `src/test/resources/fixtures/` — no hand-written JSON
- Integration tests use **Testcontainers** for PostgreSQL — no H2, no in-memory DB
- Mock only external dependencies (WebClient, Claude API) — never mock your own services
- Test names follow convention: `methodName_scenario_expectedBehavior`

### R9: Performance Testing
- k6 load test script exists in `/load-test.js`
- Before Phase 4 completion, run: `k6 run load-test.js` and document results
- Target: p95 latency <100ms for cached endpoints under 200 concurrent users
- Results documented in README.md under "Performance Benchmarks" section

---

## Git Workflow Rules

### R10: Branch Naming
```
main                        # Always deployable, deploys to AWS on merge
develop                     # Integration branch
feature/{name}              # New features (e.g., feature/three-js-orbit)
fix/{name}                  # Bug fixes (e.g., fix/cache-ttl-overflow)
chore/{name}                # Tooling, config (e.g., chore/add-flyway)
test/{name}                 # Test-only changes (e.g., test/neows-unit-test)
docs/{name}                 # Documentation only (e.g., docs/api-readme)
```

**Never commit directly to `main`.** Always PR through `develop` first.

### R11: Commit Message Format
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat:` — New feature or endpoint
- `fix:` — Bug fix
- `chore:` — Project setup, tooling, dependencies
- `docs:` — Documentation changes
- `refactor:` — Code improvement, no behavior change
- `test:` — Adding or updating tests
- `ci:` — CI/CD pipeline changes

**Examples:**
```
feat: add Three.js asteroid orbit visualizer

Implements 3D orbit rendering using NASA NeoWs orbital elements.
Converts Keplerian elements (semi-major axis, eccentricity, 
inclination) to Cartesian coordinates for Three.js scene.

Closes #12
```

```
fix: correct Redis cache TTL for ISS position

Changed TTL from 60s to 5s to match architecture spec.
ISS moves continuously — 60s is too stale.
```

### R12: Pull Request Standards
- All PRs require passing CI checks (tests + build)
- PRs to `develop`: no review required (solo project)
- PRs to `main`: self-review checklist before merge
- PR description must include:
  - What changed
  - Why it changed
  - How to test it
  - Screenshots (if UI change)

---

## API Design Rules

### R13: REST Endpoint Conventions
- Follow REST naming: `/api/{resource}` not `/api/get{Resource}`
- Use HTTP verbs correctly: GET (read), POST (create), PUT (update), DELETE (remove)
- Plural resource names: `/api/asteroids` not `/api/asteroid`
- Query params for filters: `/api/mars/photos?rover=curiosity&sol=1000`
- Return proper HTTP status codes:
  - 200 OK (success with body)
  - 201 Created (POST success)
  - 204 No Content (DELETE success)
  - 400 Bad Request (validation failure)
  - 404 Not Found (resource doesn't exist)
  - 429 Too Many Requests (rate limit exceeded)
  - 500 Internal Server Error (uncaught exception)

### R14: Response Format Standards
All JSON responses follow this structure:
```json
{
  "data": { ... },           // Success response body
  "error": null              // Null on success
}
```

Error responses:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format",
    "details": ["Date must be YYYY-MM-DD"]
  }
}
```

**Exception:** Simple GET endpoints can return data directly without wrapper (e.g., `/api/apod/today` returns `ApodEntry` JSON directly).

### R15: Cache Header Standards
All cacheable responses must include:
```
Cache-Control: public, max-age={ttl_seconds}
ETag: {hash_of_response_body}
```

Example for APOD (24h TTL):
```
Cache-Control: public, max-age=86400
ETag: "abc123def456"
```

---

## Database Rules

### R16: Flyway Migration Standards
- **Never edit an existing migration file** — always create new `Vn+1__description.sql`
- Migration files named: `V{version}__{description}.sql` (double underscore)
  - Example: `V1__create_apod.sql`, `V2__create_asteroids.sql`
- All tables have:
  - Primary key (natural key preferred over auto-increment where applicable)
  - `created_at` or `fetched_at` timestamp
- All foreign keys defined with `ON DELETE CASCADE` or `ON DELETE SET NULL`
- Indexes created for all date range query columns

### R17: Entity-Repository Conventions
- JPA entities use Lombok `@Data` annotation
- Entity class name = table name (singular): `ApodEntry` → `apod_entries`
- Repository interface extends `JpaRepository<Entity, PrimaryKeyType>`
- Custom query methods named: `findBy{Field}And{Field}OrderBy{Field}Asc`
- No `@Query` annotations unless JPQL is unavoidable

### R18: Idempotent Write Pattern
All ingestion jobs use **natural keys** for upsert:
```java
// APOD: PK = date (natural key)
ApodEntry entry = new ApodEntry();
entry.setDate(LocalDate.parse(dto.getDate()));
// ... set other fields
apodRepository.save(entry);  // JPA merges if date exists
```

This ensures re-running ingestion doesn't create duplicates.

---

## Caching Rules

### R19: Redis Cache Key Naming
- Format: `{resource}:{identifier}:{optional_filter}`
- Examples:
  - `apod:2025-04-15`
  - `asteroids:week:2025-W16`
  - `mars:photos:curiosity:FHAZ:sol:1000`
  - `ai:explain:flare:2025-04-10T12:00`
- Use lowercase, colons as separators
- No spaces or special characters in keys

### R20: TTL Strategy
**TTL must match data rate of change:**
- Static data (Mars photos, old APOD): 7 days
- Daily updated data (APOD, asteroids): 6–24 hours
- Hourly updated data (DONKI): 6 hours
- Live data (ISS position): 5 seconds
- AI explanations: 24 hours (cost optimization)

**Never use infinite TTL** — even "static" data should expire eventually.

### R21: Cache-Aside Implementation
```java
// 1. Check Redis first
String cacheKey = "apod:" + date;
ApodEntry cached = redisTemplate.opsForValue().get(cacheKey);
if (cached != null) return cached;

// 2. Query database
ApodEntry entry = apodRepository.findById(date).orElseThrow();

// 3. Store in Redis
redisTemplate.opsForValue().set(cacheKey, entry, Duration.ofHours(24));

// 4. Return
return entry;
```

**Log cache hits/misses** for monitoring:
```java
log.debug("Cache HIT: {}", cacheKey);   // or
log.debug("Cache MISS: {}", cacheKey);
```

---

## Ingestion Pipeline Rules

### R22: Cron Schedule Standards
- APOD: `0 5 0 * * *` (00:05 UTC daily)
- NeoWs: `0 10 0 * * *` (00:10 UTC daily)
- DONKI: `0 0 */6 * * *` (every 6 hours)
- Verify cron expressions at https://crontab.guru before committing

### R23: Error Handling in Jobs
```java
@Scheduled(cron = "0 5 0 * * *")
public void ingest() {
    log.info("APOD ingestion starting...");
    try {
        // ... fetch and process
        log.info("APOD ingestion complete: {} entries", count);
    } catch (Exception e) {
        log.error("APOD ingestion failed: {}", e.getMessage(), e);
        // CloudWatch alarm will trigger on ERROR log level
    }
}
```
