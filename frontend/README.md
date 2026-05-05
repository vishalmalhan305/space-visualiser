# Space Data Visualiser — Frontend

React 19 + TypeScript SPA built with Vite 8. Renders NASA data from the Spring Boot API at `localhost:8080` via a Vite dev proxy.

## Stack

| Layer | Library |
|-------|---------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Server state | TanStack React Query v5 |
| Animations | Framer Motion |
| Notifications | Sonner |
| 3D | Three.js (`OrbitVisualiser`) |
| Charts | D3.js (`ExoplanetChart`), Recharts (solar time series) |
| Maps | Leaflet.js (`IssTracker`) |
| Testing | Vitest + React Testing Library |

## Setup

```bash
npm install
npm run dev        # Vite dev server on :5173, proxies /api/* to :8080
npm run build      # TypeScript check + production build
npm run test       # Vitest
npm run lint       # ESLint
```

## Routes

| Path | Page |
|------|------|
| `/` | Dashboard — APOD hero, asteroid tracker, ISS map, solar weather |
| `/asteroids` | NEO Ledger — paginated, sortable, filterable asteroid table |
| `/mars` | Mars Gallery — masonry photo grid with rover/camera/sol filters |
| `/solar` | Solar Mission — solar event timeline and Recharts charts |
| `/exoplanets` | Exoplanet Explorer — D3.js scatter plot with AI briefing panel |

## Key Files

| File | Purpose |
|------|---------|
| `src/api/endpoints.ts` | Single source of truth for all API endpoint strings |
| `src/api/client.ts` | Axios instance (base URL from `VITE_API_BASE_URL` or proxy) |
| `src/types/` | TypeScript interfaces for all API responses — no `any` types |
| `src/hooks/` | React Query hooks wrapping each endpoint |
| `src/visualisers/` | D3.js and Three.js canvas components |

## Environment

```bash
# Optional — only needed for production builds pointing at a remote API
VITE_API_BASE_URL=https://your-api.example.com
```

In development the Vite proxy handles `/api/*` → `http://localhost:8080` automatically.
