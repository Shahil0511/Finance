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

  test("summary: forward_order_value sums the counted population", async () => {
    const [agg] = await returnsRepo.summary(RET);
    assert.equal(Number(agg.forward_order_value), 600); // 100 + 200 + 300 (RA + RB + RC)
  });

  // ─── CHARACTERIZATION of bug A1 (REFACTOR_PLAN.md) ─────────────────────────
  // The summary tiles and the detail list count DIFFERENT populations, so the
  // headline number cannot be reconciled against the rows the user can page.
  // Current: summary = 3, list = 1. Phase 2 must reconcile these (the canonical
  // population is a business decision); this test then asserts they agree.
  test("[characterizes bug A1] summary counts 3 but the list shows only 1", async () => {
    const [agg] = await returnsRepo.summary(RET);
    const rows = await returnsRepo.list(RET, SORT);
    assert.equal(Number(agg.total_returns), 3); // RA, RB, RC
    assert.equal(rows.length, 1); // only RA survives the stricter list filter
    assert.equal(rows[0].return_order_item_id, "RA");
  });

  // ─── CHARACTERIZATION of bug A2 (REFACTOR_PLAN.md) ─────────────────────────
  // The omni b2c CTE has no DISTINCT ON, so a duplicate b2c row fans ROI1 into
  // two rows. Correct = 2 returns / 800. Current (buggy) = 3 returns / 1300.
  // Phase 2 fix: add DISTINCT ON to the omni b2c CTE (mirroring the regular query).
  test("[characterizes bug A2] omni summary over-counts via b2c fan-out (3/1300, should be 2/800)", async () => {
    const [agg] = await returnsRepo.omniSummary(OMNI);
    assert.equal(Number(agg.total_returns), 3); // BUG: should be 2
    assert.equal(Number(agg.forward_order_value), 1300); // BUG: should be 800 (ROI1 counted twice)
  });

  test("[characterizes bug A2] omni list returns the duplicated row (3, should be 2)", async () => {
    const rows = await returnsRepo.omniList(OMNI, SORT);
    assert.equal(rows.length, 3); // BUG: ROI1 appears twice; should be 2
    const roi1 = rows.filter((r) => r.return_order_item_id === "ROI1");
    assert.equal(roi1.length, 2); // the fan-out
  });

  test("filters: distinct return channels include the seeded ones", async () => {
    const f = await returnsRepo.filters();
    assert.ok(f.salesChannels.includes("flipkart"));
    assert.ok(f.salesChannels.includes("myntra-omni"));
  });
}
