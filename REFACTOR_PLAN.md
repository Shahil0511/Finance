# Finance Tool — Analysis & Refactor Plan

> **Generated:** 2026-06-12 · **Scope:** full repo (`backend/`, `frontend/`, root ops) excluding `node_modules`
> **Status:** analysis only — no code changed. This document is the work tracker for the refactor.
> All findings are cited as `file:line`. Severity: **High** = fix before next release, **Medium** = schedule, **Low** = opportunistic.

---

## Executive summary

A full-stack internal finance reporting tool: Express + Postgres + Redis backend serving Sales/Returns
reports across marketplaces (generic, Myntra-Omni, TataCliq); React + Vite + RTK Query + redux-saga + Zustand
frontend. ~55 source files, **zero automated tests**.

**Verdict:** Functional and not architecturally hopeless, but it carries **finance-critical SQL correctness
bugs**, **heavy copy-paste-per-marketplace duplication**, and **two-to-three generations of dead code** layered
on top of each other, with **documentation that describes a different app**. The dominant refactor theme:
*collapse the per-marketplace duplication into config-driven modules, fix the report SQL, and delete the dead layers.*

**What's genuinely good** (so the criticism is calibrated):
- SQL values are fully parameterized (`$1..$n`) — no value-level injection.
- Postgres pooling and per-query `client.release()` are careful; request cancellation reaches `pg_cancel_backend`.
- Redis caching with normalized keys; RTK Query read cancellation on the frontend.
- Correct two-stage Docker build with healthchecks.
- `.env*` files are **not** git-tracked — no secrets in history.

---

## A. Finance-correctness bugs — HIGHEST PRIORITY

A reporting tool that miscounts money is worse than one that's down.

| # | Sev | Issue | Location |
|---|-----|-------|----------|
| A1 | **High** | **Returns list and summary count different populations.** Summary uses `RETURN_BASE_CTE` (previous-month grace `EXTRACT(DAY…)<=2`); list uses `RETURN_DETAIL_BASE_CTE` (no grace, different inclusion predicate + dedup key). On the 1st–2nd of a month the summary tiles include last month but the detail rows don't → **headline numbers won't reconcile with the table.** | `returnsRepository.js:27-35` vs `62-81` |
| A2 | ✅ Fixed | **Myntra-Omni returns over-count & duplicate.** The omni `b2c` CTE lacked `DISTINCT ON`, so the `LEFT JOIN` fanned out duplicate rows → inflated `COUNT(*)` and `SUM(forward_order_value)`. **FIXED 2026-06-12** — added `DISTINCT ON (channel_order_id, client_sku_id_ean)` (mirroring the regular query); guarded by `returns.integration.test.js`. | `returnsRepository.js:608` |
| A3 | **High** | **Sales revenue likely undercounts.** `total_sale_value` sums `unit_sale_price` with no `× dispatched_quantity`; same for `total_tax`. Any line with qty > 1 is wrong. (Confirm column semantics first.) | `salesRepository.js:395-396` |
| A4 | Medium | **Valid-looking sort → HTTP 500.** One shared `ALLOWED_SORT_COLS` spans queries with different column sets, so e.g. `?sortBy=split_mrp` passes validation then throws `column does not exist`. | `salesRepository.js:5-47, 381-383` |
| A5 | Medium | **Pagination `total`/`totalPages` are fake** — only ever report "current page (+1)" (`total = offset + data.length + (hasMore?1:0)`). Frontend Next button is gated on the fake `totalPages` and can block paging forward. | `pagination.js:29,37`; `shared/DataTable.jsx:168-172` |
| A6 | Medium | Float money risk: returns cast `SUM(x::numeric)`, sales don't. If columns are `double precision`, sales sums accumulate float error. | `salesRepository.js:395` vs `returnsRepository.js:1009` |
| A7 | Low | JS computes date defaults in **local** time while SQL bounds on Postgres `CURRENT_DATE`. Different Node/DB timezones can flip the month boundary and the day-1–2 grace. | `dateRange.js:7-25` |

---

## B. Security

| # | Sev | Issue | Location |
|---|-----|-------|----------|
| B1 | N/A — by design | **No in-process auth, intentionally.** Auth/authz is handled by the upstream system (Data Nexus / session cookies); this service is never exposed directly. **No action** — confirmed with owner 2026-06-12. (Stray `API_SECRET`/auth references scrubbed from `.env.example`.) | `server.js:76` |
| B2 | Medium | **CSV export buffers the entire result set** (no `LIMIT`, `.join("\n")` of all rows, array + string both retained) → OOM on a large month. | `csv.js:12-19`; `salesRepository.js:463-471` |
| B3 | Medium | **CSV formula injection** — only quotes escaped; values starting `= + - @` (e.g. `brand` from channel feeds) execute as formulas in Excel/Sheets. | `csv.js:9` |
| B4 | Medium | **Error detail leaks to clients** — `detail: err.detail || err.message` returns raw `pg` errors (table/column names) on 500s. | `middlewares/errorHandler.js:21` |
| B5 | Medium | **Rate limiting collapses behind a proxy** — keyed on `req.ip` but `trust proxy` never set, so all clients share one bucket behind Nginx/IIS. `passOnStoreError:true` → a Redis blip disables limiting. | `rateLimiter.js:104-112`; `server.js` |
| B6 | Medium | **CORS defaults to `*`** (GET-only) — too open for an internal tool with no in-process auth. | `server.js:37-42` |
| B7 | Medium | **Real credentials in working-tree env files** (not in git, but `backend/.env.example` — a template meant to be shared — holds a real `MSSQL_PASSWORD`/`API_SECRET`; root `.env` + `backend/.env` hold a real DB password). Scrub to placeholders; rotate anything shared. | `backend/.env.example`, `.env` |
| B8 | Low | `DB_SSL=true` sets `rejectUnauthorized:false` (accepts any cert → MITM). `ORDER BY ${sortBy}` is interpolated — safe today only via the upstream validator; no repo-internal guard. | `postgres.js:11`; `salesRepository.js:383` |

---

## C. Broken & dead code (safe to delete)

> ✅ **All items in this section completed 2026-06-12** (deletions staged in git; require graph verified loading). Boxes below left as a record.

- [ ] **`loadbalancer.js` (root) — broken & dead.** Swapped handler params `(res, req)`, `server.length` (undefined; should be `servers`), `clientReq`/`clientRes` vs misspelled params `clienReq`/`clienRes` → guaranteed `ReferenceError` on first request. Referenced by nothing.
- [ ] **`.gitignore` corrupted** — lines 36–37 are a tab-separated dump of DB column names pasted in by accident.
- [ ] **`backend/db/mssql.js` — entirely dead.** Nothing imports it; the advertised `SALES_DB`/`RETURNS_DB` per-report DB routing is read by **no code**. Both repos hard-require Postgres.
- [ ] **Unused backend deps:** `ioredis` (real client is node-`redis`), `json2csv` (CSV is hand-rolled; also pinned to an **alpha** `^6.0.0-alpha.2`).
- [ ] **`redis.invalidateCache`** — exported, never called (cache is TTL-only). `db/redis.js:128,188`.
- [ ] **`frontend/src/utils/api.js` — entirely dead AND a hazard:** re-exports the names `salesApi`/`returnsApi`, colliding with the real RTK Query clients. (Its `downloadBlob` is exactly the helper the 6 copy-pasted export blocks need.)
- [ ] **`frontend/src/hooks/useDebounce.js`** — dead (panels use Apply-button commit instead).
- [ ] **3 orphan components (a whole pre-Redux generation):** `components/DataTable.jsx`, `components/Filters.jsx`, `components/SummaryCards.jsx` (inline styles, prop-drilling, direct DOM hover mutation). Superseded by `shared/DataTable.jsx` + per-marketplace components. `SummaryCards.jsx` is config-driven — the very abstraction now needed, abandoned.
- [ ] **Vestigial frontend config:** Tailwind **v4** doesn't load `tailwind.config.js` (no `@config`; theme lives in `globals.css @theme`); `postcss`/`autoprefixer` devDeps are unused (empty `postcss.config.js`).

---

## D. Duplication & architecture (the core structural problem)

**Backend — sales and returns are ~80% copy-paste across all three layers:**
- Controllers/services/repositories mirror each other; `datedFilename`, `withExecutionTime`, and the `cacheKey` closure are byte-identical across files.
- The ~45-line `b2c` projection is pasted **5×** in `returnsRepository.js`; `RETURN_EXPORT_QUERY` and `PAST_RETURN_EXPORT_QUERY` are ~98% identical (differ by one date predicate).
- The "No records found" export block is copy-pasted **6×** across controllers.
- **Duplicate `middleware/` (singular) and `middlewares/` (plural) dirs** — plural set is imported; three of its files are one-line re-export shims back to the singular impls. No file is strictly dead, but it's pointless indirection — collapse to one dir.

**Frontend — 5 parallel marketplace "stacks" that should be ~4 config-driven components:**
- `SummaryCards` ×5 (~95% identical, differ by a `CARDS` array + which hook), `FiltersPanel` ×5 (~85–90%; `FilterSelect`/`FilterInput`/`DownloadWindowNotice` duplicated verbatim in each; Myntra & TataCliq returns panels ~98% identical), `DataTable` wrappers ×5 (~80–85%), Pages ×5 (~90–95%).
- **5 Zustand filter stores** identical but for their `DEFAULT_*` constants → a `createFilterStore(defaults)` factory collapses ~40 lines to ~10.
- **Two export architectures coexist:** saga + `uiSlice` flags (Sales, Returns) vs hand-rolled `fetch`+blob with local `useState` (TataCliq, Omni, Returns "Past Sale Return" button) — `ReturnsDataTable` uses **both at once**. The blob-download dance is copy-pasted **6×**, none of it cancellable.
- **Not a conflict:** the Redux-vs-Zustand split is fine — theme + filters live in Zustand, server cache + notifications + export flags in Redux; disjoint state. The real issue is the half-migrated export path.

**Frontend bugs worth noting:**
- Export `fetch`es have **no `AbortController` and no timeout** (`takeLatest` cancels the generator, not the in-flight request) — contradicts `PERFORMANCE_NOTES.md`. `salesSaga.js:20,54`.
- Array index used as React key in all tables (`shared/DataTable.jsx:130`).
- Sort headers + icon-only pagination not keyboard/AT accessible (`shared/DataTable.jsx:105-117, 161-174`).
- Filter labels lack `htmlFor`/`id` (all panels).
- `split_remakrs` typo → always-empty column (`TataCliqSalesDataTable.jsx:35`).
- `opacity:1` copy-paste typo kills one panel's fade-in (`MyntraOmniReturnsFiltersPanel.jsx:84`).

---

## E. Docs, config & ops

- **README describes a different/older app** and breaks a fresh setup: documents `middleware/auth.js`, `components/ExportBar.jsx`, a `dist/` build folder (Vite outputs to `../backend/public`), and **`PG_*` env vars while the code reads `DB_*`**. `.env.example` repeats the wrong `PG_*` names → copying it to `.env` leaves Postgres all-`undefined`.
- **"MSSQL configurable per report" is fiction** (no code reads `SALES_DB`/`RETURNS_DB`).
- **Port drift:** Docker uses `5555`; everything else (appConfig default, Vite dev proxy, `.env.example`, README) says `4000`.
- **Committed build bundle:** `backend/public/assets/*` is a committed Vite build served by Express. Docker rebuilds it (and `.dockerignore` excludes it), so it's only used by bare `node server.js` — pure drift risk. Should be gitignored and built, not committed.
- **No Node `engines`** constraint in either package.json.

---

## Refactor plan (phased, risk-ordered)

> **Guiding rule** for a finance tool with zero tests: *don't refactor behavior you can't verify.*
> Lock outputs first, fix correctness second, restructure third.

### Phase 0 — Safety net (before touching report logic) — 🟡 IN PROGRESS
- [x] Unit tests (`node:test`, zero deps) for the pure logic: `pagination`, `csv`, `dateRange`, `reportQueryValidator` — **24 tests** via `npm test`. Includes characterization tests pinning bugs A5 + B3, and security tests for the sort allow-list.
- [x] DB-backed integration harness: `docker-compose.test.yml` (ephemeral Postgres) + `backend/test/integration/{schema.sql, seed.sales.sql}` + `npm run test:integration`. Sales list/summary/export/filters covered (**5 tests**), including one that reproduces bug **A3 live** (revenue 350 vs correct 600). `npm test` self-skips integration when `TEST_DATABASE_URL` is unset, so it never touches a real DB. (`postgres.js` gained `end()` so the pool closes cleanly — also needed for the Phase 2 graceful-shutdown fix.)
- [ ] Extend integration coverage to **Returns / Myntra-Omni / TataCliq** — where bugs A1 (list vs summary) and A2 (omni over-count) live; they need their own seed + tests before the Phase 2 fixes.
- [ ] Wire **ESLint** (incl. `react-hooks/exhaustive-deps`) + an unused-export check to surface dead code mechanically.
- [ ] Add `engines` (Node 20) to both `package.json`; add CI running install + build + tests.

### Phase 1 — Delete dead weight & fix docs (zero behavior change) — ✅ DONE 2026-06-12
- [x] Deleted `loadbalancer.js`, `backend/db/mssql.js`, `frontend/src/utils/api.js`, `frontend/src/hooks/useDebounce.js`, the 3 orphan components, `tailwind.config.js`, and `postcss.config.js`.
- [x] Removed unused deps from package.json (`ioredis`, `json2csv`, `mssql` backend; `postcss`, `autoprefixer` frontend) and the dead `redis.invalidateCache`. ⚠️ **Run `npm install` in `backend/` and `frontend/`** to prune the lockfiles.
- [x] Fixed the corrupted `.gitignore` (removed the accidental column-name dump).
- [x] Rewrote README to match reality; rewrote `.env.example` (correct `DB_*` names, secret-free, MSSQL/auth fiction removed). ⚠️ **Rotate** the real `MSSQL_PASSWORD`/RDS host that were in the old `.env.example` if still live.
- [x] Collapsed the two middleware dirs into `middlewares/` (real impls moved in via `git mv`; singular dir + shims gone). Require graph verified.
- [x] Untracked the committed SPA bundle: added `backend/public/` to `.gitignore` and ran `git rm --cached -r backend/public` (deploy is always Docker / fresh build — confirmed 2026-06-12). 4000-vs-5555 port left as-is but documented in the README.

### Phase 2 — Correctness & security fixes (behavior changes — guarded by Phase 0 tests)
- [ ] **A1:** unify the returns list/summary base CTEs (same population + date window).
- [x] **A2:** added `DISTINCT ON (channel_order_id, client_sku_id_ean)` to the omni b2c CTE (2026-06-12) — omni summary/list no longer double-count via b2c fan-out. Verified by integration tests.
- [ ] **A3:** fix sales revenue to `× dispatched_quantity` (after confirming column semantics); **A6:** add `::numeric` casts to sales sums.
- [ ] **A4:** per-query sort allow-lists + a **repo-internal** `sortBy ∈ allowed` / `sortDir ∈ {ASC,DESC}` guard.
- [ ] **B2/B3:** stream + bound CSV exports; prefix `= + - @` values with `'`.
- [ ] **B4:** stop returning raw error `detail` in non-dev. **B5:** set `trust proxy`; reconsider `passOnStoreError`. **B6:** default CORS to an allowlist. (**B1** dropped — auth is handled upstream by design.)
- [ ] Lifecycle: `pool.end()` on shutdown + force-exit timeout; move per-request `mkdirSync` out of the logging hot path; honor `testConnection()`'s result.
- [ ] Frontend: `AbortController` + timeout on exports; real row keys; fix `split_remakrs`, the `opacity:1` typo, label `htmlFor`/`id`, keyboard/aria on sort + pagination.

### Phase 3 — Backend structural refactor
- [ ] Introduce a **report-module factory** parameterized by `{ baseCte, whereSql, exportCols, allowedSortCols, filenamePrefix }` emitting the controller+service+repository trio; extract a shared `B2C_PROJECTION` SQL fragment (kills the 5× paste) and a shared `exportHandler(res, result, prefix)` (kills the 6× block).
- [ ] Centralize config: add DB / Redis / CORS / rate-limit sections to `appConfig.js` so nothing reads `process.env` ad hoc (root cause of the `DB_*`/`PG_*` drift).

### Phase 4 — Frontend structural refactor
- [ ] Collapse the 5 stacks into **config-driven components** + a per-marketplace registry: one `<SummaryCards>`, one `<FiltersPanel>` (hoist `FilterSelect`/`FilterInput`/`DownloadWindowNotice` into `ui/`), one `<MarketplaceTable>`, one `<ReportPage>` shell driven by a routes array.
- [ ] Replace the 5 Zustand stores with a `createFilterStore(defaults)` factory; unify both export paths behind one `useCsvExport(endpoint, filenamePrefix)` hook.

### Phase 5 — DB performance (DBA-owned; already scoped in PERFORMANCE_NOTES.md)
- [ ] Pursue index/materialized-view recommendations for the heavy report joins; move large exports to an async job flow. Track separately — needs DBA access, not app changes.

---

**Net effect:** ~20 frontend component files → ~4 + a registry; backend sales/returns trio → one factory;
two-to-three dead generations removed; the finance numbers actually reconcile.

---

### Appendix — quick delete list (Phase 1, copy-paste reference)

```
loadbalancer.js
backend/db/mssql.js
frontend/src/utils/api.js
frontend/src/hooks/useDebounce.js
frontend/src/components/DataTable.jsx
frontend/src/components/Filters.jsx
frontend/src/components/SummaryCards.jsx
frontend/tailwind.config.js          # vestigial under Tailwind v4
```
Deps to drop: `ioredis`, `json2csv` (backend) · `postcss`, `autoprefixer` (frontend devDeps)
Dead export to drop: `invalidateCache` in `backend/db/redis.js`
