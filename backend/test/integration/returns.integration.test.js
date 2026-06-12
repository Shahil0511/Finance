"use strict";

// Integration tests for the RETURNS report repository against a real Postgres.
// Reproduces bugs A1 (summary vs list population mismatch) and A2 (omni over-count).
//   TEST_DATABASE_URL=postgres://test:test@localhost:5544/finance_test npm run test:integration
// Skipped (never connects) when TEST_DATABASE_URL is unset.

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  test("returns integration (skipped — set TEST_DATABASE_URL to run)", { skip: true }, () => {});
} else {
  const u = new URL(TEST_DATABASE_URL);
  process.env.DB_HOST = u.hostname;
  process.env.DB_PORT = u.port || "5432";
  process.env.DB_NAME = u.pathname.replace(/^\//, "");
  process.env.DB_USER = decodeURIComponent(u.username);
  process.env.DB_PASSWORD = decodeURIComponent(u.password);
  process.env.DB_SSL = "false";

  const { Client } = require("pg");
  const db = require("../../db/postgres");
  const returnsRepo = require("../../repositories/returnsRepository");

  const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

  // Regular returns params $1..$6: [dateFrom, dateTo, salesChannel, returnStatus, qcStatus, search]
  const RET = ["2000-01-01", "2100-01-01", null, null, null, null];
  // Omni params $1..$5: [dateFrom, dateTo, returnStatus, qcStatus, search]
  const OMNI = ["2000-01-01", "2100-01-01", null, null, null];
  const SORT = { sortBy: "return_order_processed_time", sortDir: "DESC", pageLimit: 51, offset: 0 };

  before(async () => {
    const admin = new Client({ connectionString: TEST_DATABASE_URL });
    await admin.connect();
    await admin.query(read("schema.sql"));
    await admin.query(read("seed.returns.sql"));
    await admin.end();
  });

  after(async () => {
    await db.end();
  });

  // ─── A1 FIXED (REFACTOR_PLAN.md) ──────────────────────────────────────────
  // summary() now uses the same strict base CTE as the list (item_id NOT NULL,
  // forward order >= 2026-01-01), so the headline reconciles with the rows.
  // Only RA qualifies; RB (item_id NULL) and RC (2025 forward order) drop from both.
  // (Assertions flipped from summary 3/600 to summary 1/100 when the fix landed.)
  test("[A1 fixed] summary forward_order_value matches the strict population (100)", async () => {
    const [agg] = await returnsRepo.summary(RET);
    assert.equal(Number(agg.forward_order_value), 100); // RA only
  });

  test("[A1 fixed] summary and list count the SAME population (1)", async () => {
    const [agg] = await returnsRepo.summary(RET);
    const rows = await returnsRepo.list(RET, SORT);
    assert.equal(Number(agg.total_returns), 1); // reconciles with the list
    assert.equal(rows.length, 1);
    assert.equal(rows[0].return_order_item_id, "RA");
  });

  // ─── A2 FIXED (REFACTOR_PLAN.md) ──────────────────────────────────────────
  // The omni b2c CTE now has DISTINCT ON (channel_order_id, client_sku_id_ean),
  // mirroring the regular return query, so a duplicate b2c row no longer fans a
  // return into multiple rows. (These assertions were flipped from 3/1300 → 2/800
  // when the fix landed; they now guard against the over-count regressing.)
  test("[A2 fixed] omni summary dedups the b2c fan-out (2 returns / 800)", async () => {
    const [agg] = await returnsRepo.omniSummary(OMNI);
    assert.equal(Number(agg.total_returns), 2); // ROI1 + ROI2; ROI1 no longer doubled
    assert.equal(Number(agg.forward_order_value), 800); // 500 + 300
  });

  test("[A2 fixed] omni list returns one row per return (2)", async () => {
    const rows = await returnsRepo.omniList(OMNI, SORT);
    assert.equal(rows.length, 2); // ROI1, ROI2 — no duplicate
    const roi1 = rows.filter((r) => r.return_order_item_id === "ROI1");
    assert.equal(roi1.length, 1); // fan-out collapsed
  });

  test("filters: distinct return channels include the seeded ones", async () => {
    const f = await returnsRepo.filters();
    assert.ok(f.salesChannels.includes("flipkart"));
    assert.ok(f.salesChannels.includes("myntra-omni"));
  });
}
