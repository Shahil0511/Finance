"use strict";

// Integration tests for the SALES report repository against a real Postgres.
// Run with:  TEST_DATABASE_URL=postgres://test:test@localhost:5544/finance_test \
//            npm run test:integration
// Without TEST_DATABASE_URL the suite is skipped, so plain `npm test` stays green
// and NEVER connects to a real database.

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  test("sales integration (skipped — set TEST_DATABASE_URL to run)", { skip: true }, () => {});
} else {
  // Redirect the app's pg pool to the throwaway DB BEFORE requiring it.
  // (postgres.js reads DB_* at module load; dotenv won't override already-set vars.)
  const u = new URL(TEST_DATABASE_URL);
  process.env.DB_HOST = u.hostname;
  process.env.DB_PORT = u.port || "5432";
  process.env.DB_NAME = u.pathname.replace(/^\//, "");
  process.env.DB_USER = decodeURIComponent(u.username);
  process.env.DB_PASSWORD = decodeURIComponent(u.password);
  process.env.DB_SSL = "false";

  const { Client } = require("pg");
  const db = require("../../db/postgres");
  const salesRepo = require("../../repositories/salesRepository");

  const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

  // No-filter query params $1..$10. Wide dates let the in-SQL month window govern.
  // [dateFrom, dateTo, salesChannel, category, orderStatus, warehouse, paymentType, search, state, brand]
  const MYNTRA = ["2000-01-01", "2100-01-01", "MYNTRA", null, null, null, null, null, null, null];
  const LIST_OPTS = { sortBy: "handover_time", sortDir: "DESC", pageLimit: 51, offset: 0 };

  before(async () => {
    const admin = new Client({ connectionString: TEST_DATABASE_URL });
    await admin.connect();
    await admin.query(read("schema.sql")); // simple-query protocol -> multi-statement OK
    await admin.query(read("seed.sales.sql"));
    await admin.end();
  });

  after(async () => {
    await db.end(); // close the pool so the test process exits cleanly
  });

  test("summary: order count, dispatched qty, tax and SLA are correct", async () => {
    const [agg] = await salesRepo.summary(MYNTRA);
    assert.equal(Number(agg.total_orders), 2); // distinct parents P1, P2
    assert.equal(Number(agg.total_dispatched), 6); // 3 + 1 + 2
    assert.equal(Number(agg.total_tax), 108); // (18*3)+(36*1)+(9*2) — now × dispatched_quantity
    assert.equal(Number(agg.sla_breached_count), 0);
  });

  // ─── A3 FIXED (REFACTOR_PLAN.md) ──────────────────────────────────────────
  // total_sale_value now sums unit_sale_price × dispatched_quantity.
  // 100*3 + 200*1 + 50*2 = 600. (Assertion flipped from the buggy 350 when fixed.)
  test("[A3 fixed] revenue = Σ price × quantity (600)", async () => {
    const [agg] = await salesRepo.summary(MYNTRA);
    assert.equal(Number(agg.total_sale_value), 600);
  });

  test("list: only in-window rows; the 2-months-old row is excluded", async () => {
    const rows = await salesRepo.list(MYNTRA, LIST_OPTS);
    assert.equal(rows.length, 3);
    assert.ok(rows.every((r) => r.sales_channel === "MYNTRA"));
    assert.ok(!rows.some((r) => r.channel_parent_order_id === "P9")); // out of window
    // city/state hydrated via the pincodes join
    const delhi = rows.find((r) => r.customer_billing_pin === "110001");
    assert.equal(delhi.state, "DL");
  });

  // B2: exports stream rows via a pg cursor instead of buffering the result set.
  test("exportStream: streams the same population as list, unpaginated", async () => {
    const stream = await salesRepo.exportStream(MYNTRA);
    const rows = [];
    for await (const row of stream) rows.push(row);
    assert.equal(rows.length, 3);
    assert.ok(rows.every((r) => r.sales_channel === "MYNTRA"));
  });

  test("filters: distinct option lists are populated", async () => {
    const f = await salesRepo.filters();
    assert.ok(f.salesChannels.includes("MYNTRA"));
    assert.ok(f.brands.includes("BrandA"));
    assert.ok(f.states.includes("DL"));
    assert.ok(f.categories.includes("Apparel"));
  });
}
