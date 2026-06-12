

-- Recommended indexes for the finance reports (run as a DBA; the app's DB user
-- is read-only). Evidence from EXPLAIN against the production database on
-- 2026-06-12 — see REFACTOR_PLAN.md "Performance" for the full diagnosis.

-- 1. STRONGLY RECOMMENDED — Tata Cliq returns is the last slow report (~15s).
--    Its sp1 CTE joins b2c_non_split (19M rows) on (channel_parent_order_id,
--    client_sku_id), which has no index, forcing a hash join over a large scan.
--    Expected effect: Tata Cliq returns list/summary/export drop to ~2-3s.




-- 2. OPTIONAL — shaves the OSD scan inside the sales reports. The window
--    predicate already prunes sales_order_detail to ~9 weekly chunks, which
--    are then seq-scanned on handover_time. A per-chunk handover index makes
--    that a range scan. Only worthwhile if sales pages need to get faster
--    than the current ~3-5s.
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_osd_handover_time
--   ON public.sales_order_detail (handover_time);
