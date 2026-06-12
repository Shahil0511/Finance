"use strict";

/* Read-only performance diagnosis against the configured database.
   Usage: node scripts/diagnose-performance.js [--analyze]
   --analyze additionally runs EXPLAIN ANALYZE (executes the reads) on the
   hottest queries with a 1-day window. Plain mode never executes report SQL. */

const db = require("../db/postgres");

const TABLES = [
  "b2c_detail",
  "sales_order_detail",
  "pincodes",
  "b2c_non_split",
  "return_order_report_item_level_wms",
];

const hr = (t) => console.log(`\n${"═".repeat(70)}\n${t}\n${"═".repeat(70)}`);

async function main() {
  const analyze = process.argv.includes("--analyze");

  hr("SERVER");
  console.log((await db.query("SELECT version()"))[0].version);
  const settings = await db.query(`
    SELECT name, setting, unit FROM pg_settings
    WHERE name IN ('shared_buffers','effective_cache_size','work_mem',
                   'max_parallel_workers_per_gather','jit','random_page_cost',
                   'max_connections')
    ORDER BY name`);
  for (const s of settings) console.log(`  ${s.name} = ${s.setting}${s.unit ?? ""}`);

  hr("TABLE SIZES (estimates from pg_class)");
  const sizes = await db.query(`
    SELECT c.relname,
           c.reltuples::bigint                          AS approx_rows,
           pg_size_pretty(pg_table_size(c.oid))         AS table_size,
           pg_size_pretty(pg_indexes_size(c.oid))       AS index_size
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = ANY($1) AND c.relkind = 'r'
    ORDER BY c.reltuples DESC`, [TABLES]);
  for (const r of sizes) {
    console.log(`  ${r.relname.padEnd(38)} ~${String(r.approx_rows).padStart(12)} rows  table=${r.table_size}  idx=${r.index_size}`);
  }

  hr("INDEXES");
  const idx = await db.query(
    `SELECT tablename, indexdef FROM pg_indexes WHERE tablename = ANY($1) ORDER BY tablename, indexname`,
    [TABLES],
  );
  if (!idx.length) console.log("  !! NO INDEXES on any report table !!");
  for (const r of idx) console.log(`  [${r.tablename}] ${r.indexdef}`);

  hr("SCAN STATS (pg_stat_user_tables)");
  const stats = await db.query(`
    SELECT relname, seq_scan, COALESCE(idx_scan,0) AS idx_scan, n_live_tup
    FROM pg_stat_user_tables WHERE relname = ANY($1) ORDER BY seq_scan DESC`, [TABLES]);
  for (const r of stats) {
    console.log(`  ${r.relname.padEnd(38)} seq_scan=${String(r.seq_scan).padStart(8)}  idx_scan=${String(r.idx_scan).padStart(8)}  live=${r.n_live_tup}`);
  }

  hr("KEY COLUMN TYPES");
  const cols = await db.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_name = ANY($1)
      AND column_name IN ('handover_time','return_order_processed_time',
                          'forward_order_creation_time','channel_order_time',
                          'sales_channel','system_invoice_line_item_id',
                          'channel_order_date','customer_billing_pin','pincode')
    ORDER BY table_name, column_name`, [TABLES]);
  for (const r of cols) console.log(`  ${r.table_name}.${r.column_name}: ${r.data_type}`);

  /* ── Query plans via the real repository SQL ─────────────────────────── */
  const origQuery = db.query;
  const explainWith = (prefix) => (sql, params) => origQuery(`${prefix} ${sql}`, params);

  const planOf = async (label, run, prefix) => {
    hr(`PLAN: ${label}${prefix.includes("ANALYZE") ? "  (executed)" : "  (estimate only)"}`);
    db.query = explainWith(prefix);
    try {
      const t0 = Date.now();
      const rows = await run();
      const ms = Date.now() - t0;
      for (const r of rows) console.log("  " + r["QUERY PLAN"]);
      console.log(`  -- explain round-trip: ${ms}ms`);
    } catch (err) {
      console.log(`  !! ${err.message}`);
    } finally {
      db.query = origQuery;
    }
  };

  const salesRepo = require("../repositories/salesRepository");
  const returnsRepo = require("../repositories/returnsRepository");

  // Full current-month window (what the dashboard issues by default).
  const MONTH_SALES = ["2026-06-01", "2026-06-13", null, null, null, null, null, null, null, null];
  const MONTH_RETURNS = ["2026-06-01", "2026-06-13", null, null, null, null];
  const SORT = { sortBy: "handover_time", sortDir: "DESC", pageLimit: 51, offset: 0 };
  const RSORT = { sortBy: "return_order_processed_time", sortDir: "DESC", pageLimit: 51, offset: 0 };

  const EST = "EXPLAIN (FORMAT TEXT)";
  await planOf("sales list (month window)", () => salesRepo.list(MONTH_SALES, SORT), EST);
  await planOf("sales summary (month window)", () => salesRepo.summary(MONTH_SALES), EST);
  await planOf("returns list (month window)", () => returnsRepo.list(MONTH_RETURNS, RSORT), EST);
  await planOf("returns summary (month window)", () => returnsRepo.summary(MONTH_RETURNS), EST);

  hr("PLAN: filters DISTINCT — windowed, as the repo now issues (estimate only)");
  for (const q of [
    `SELECT DISTINCT sales_channel AS val FROM b2c_detail
     WHERE handover_time >= $1::date AND handover_time < $2::date
       AND channel_invoice_time >= $1::date - INTERVAL '45 days' AND channel_invoice_time < $2::date
       AND sales_channel IS NOT NULL ORDER BY 1`,
    `SELECT DISTINCT category AS val FROM sales_order_detail
     WHERE handover_time >= $1::date AND handover_time < $2::date
       AND channel_order_date >= $1::date - INTERVAL '60 days' AND channel_order_date < $2::date
       AND category IS NOT NULL ORDER BY 1`,
  ]) {
    console.log(`\n  ── ${q.replace(/\s+/g, " ").slice(0, 80)}…`);
    const rows = await origQuery(`${EST} ${q}`, [MONTH_SALES[0], MONTH_SALES[1]]);
    for (const r of rows) console.log("  " + r["QUERY PLAN"]);
  }

  if (analyze) {
    const AN = "EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, FORMAT TEXT)";
    // 1-day window keeps execution bounded.
    const DAY_SALES = ["2026-06-12", "2026-06-13", null, null, null, null, null, null, null, null];
    await planOf("sales summary 1-DAY window", () => salesRepo.summary(DAY_SALES), AN);
  }

  await db.end();
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
