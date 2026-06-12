# Sales & Returns Finance Tool
## Internal Web Tool — Finance Team Daily Reports

A full-stack internal tool that serves the finance team self-serve daily dashboards for **Sales** and
**Returns** across marketplaces (generic, Myntra-Omni, TataCliq) — with filters, server-side pagination,
Redis-cached queries, and CSV export.

> **Auth:** Authentication/authorization is handled by the **upstream system** (Data Nexus / session
> cookies). This service has **no in-process auth** by design and is not meant to be exposed directly.

---

## Tech Stack
- **Backend:** Node.js + Express, PostgreSQL (`pg`), Redis (`redis`) for caching + rate-limit store
- **Frontend:** React 18 + Vite SPA — RTK Query + redux-saga (server data/exports) and Zustand (filters + theme), Tailwind v4, framer-motion
- **Export:** CSV (hand-rolled in `backend/utils/csv.js`)
- **Database:** PostgreSQL only

---

## Project Structure

```
finance-tool/
├── docker-compose.yml          # backend + redis; builds frontend; exposes :5555
├── Dockerfile                  # 2-stage: build frontend → run backend
├── backend/
│   ├── server.js               # Express app: serves API + built SPA
│   ├── config/appConfig.js     # port, basePath, cache TTLs, pagination
│   ├── db/                     # postgres.js, redis.js
│   ├── routes/                 # sales.js, returns.js (thin → controllers)
│   ├── controllers/            # request/response glue
│   ├── services/               # business logic + execution timing
│   ├── repositories/           # SQL (parameterized)
│   ├── middlewares/            # cache, rateLimiter, requestLogger, errorHandler,
│   │                           #   requestContext, requestSignal
│   ├── validators/             # reportQueryValidator (sort allow-list, date/page)
│   ├── utils/                  # csv, dateRange, pagination, httpErrors, fileLogger
│   └── public/                 # built SPA (output of `npm run build` in /frontend)
└── frontend/
    └── src/
        ├── app/                # redux store + rootSaga
        ├── features/           # sales/returns RTK Query APIs + export sagas, ui/notifications slices
        ├── store/              # zustand: useFilterStore, useThemeStore
        ├── components/         # shared/DataTable + per-marketplace tables/panels/cards, ui/, layout/
        ├── pages/              # SalesReport, ReturnsReport, MyntraOmniReturnsReport, TataCliq{Sales,Returns}Report
        └── config/apiBase.js   # same-origin API base
```

---

## Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # then fill in DB_* and REDIS_URL
npm run dev                 # nodemon, or: node server.js
```
The API listens on `PORT` (default **4000**) and serves under the base path `VITE_BASE_PATH`
(default `/finance-gst-tracker`). Health check: `GET /health`.

**Required env** (see `backend/.env.example` for the full list): the app reads **`DB_*`** names
(`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`) — *not* `PG_*`. Redis is
configured via `REDIS_URL`. Redis is optional: if it's unreachable the app runs without cache.

### 2. Frontend — dev mode
```bash
cd frontend
npm install
npm run dev                 # Vite dev server on :5173, proxies /api → http://127.0.0.1:4000
```

### 3. Frontend — production build
```bash
cd frontend
npm run build               # Vite outputs to ../backend/public (NOT dist/)
```
The backend then serves the built SPA and the API together. Start the backend and open
`http://<host>:4000/finance-gst-tracker/`.

### 4. Docker (recommended for deployment)
```bash
docker compose up --build
```
The Dockerfile builds the frontend (stage 1) and runs the backend (stage 2). Compose starts the app
plus a Redis container and exposes the app on **:5555** (note: bare `node server.js` defaults to **4000**;
Docker overrides `PORT=5555`). DB credentials come from an `.env` file referenced by compose.

---

## Finance Team Access

Reports available: **Sales**, **Returns**, **Myntra-Omni Returns**, **TataCliq Sales**, **TataCliq Returns**.
Each report supports:
- Date-range filtering (Sales by handover date, Returns by processed date) with a current-month default window
- Channel / status / QC / region filters (applied on **Apply Filters**)
- Server-side pagination (`hasMore` strategy — avoids a full COUNT on every load)
- CSV export of the filtered view

---

## Notes / Known limitations

- See `PERFORMANCE_NOTES.md` for caching behavior and DBA index recommendations.
- See `REFACTOR_PLAN.md` for the current audit findings and the staged refactor (correctness fixes,
  duplication cleanup). Some report-correctness items there are open.
- CSV exports are synchronous; very large exports hold the request open.
