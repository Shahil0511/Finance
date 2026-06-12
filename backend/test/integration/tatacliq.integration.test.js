"use strict";

// Integration tests for the TataCliq sales + returns queries (the sp1
// sub-order-split joins were previously untested). Also guards the
// split_remakrs → split_remarks rename.
//   TEST_DATABASE_URL=postgres://test:test@localhost:5544/finance_test npm run test:integration
// Skipped (never connects) when TEST_DATABASE_URL is unset.

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  test("tatacliq integration (skipped — set TEST_DATABASE_URL to run)", { skip: true }, () => {});
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
  const salesRepo = require("../../repositories/salesRepository");
  const returnsRepo = require("../../repositories/returnsRepository");
  const { businessWindow } = require("../../utils/dateRange");

  const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

  // The window is clamped in JS now — repos expect final dates.
  const W = businessWindow();
  // TataCliq sales params $1..$8: [dateFrom, dateTo, orderStatus, warehouse, paymentType, state, brand, search]
  const SALES = [W.from, W.to, null, null, null, null, null, null];
  // TataCliq returns params $1..$5: [dateFrom, dateTo, returnStatus, qcStatus, search]
  const RETURNS = [W.from, W.to, null, null, null];
  const SALES_SORT = { sortBy: "handover_time", sortDir: "DESC", pageLimit: 51, offset: 0 };
  const RETURNS_SORT = { sortBy: "return_order_processed_time", sortDir: "DESC", pageLimit: 51, offset: 0 };

  before(async () => {
    const admin = new Client({ connectionString: TEST_DATABASE_URL });
    await admin.connect();
    await admin.query(read("schema.sql"));
    await admin.query(read("seed.tatacliq.sql"));
    await admin.end();
  });

  after(async () => {
    await db.end();
  });

  test("tata sales list: sp1 split join works and split_remarks is exposed", async () => {
    const rows = await salesRepo.tataCliqList(SALES, SALES_SORT);
    assert.equal(rows.length, 2);
    const tp1 = rows.find((r) => r.channel_parent_order_id === "TP1");
    assert.equal(tp1.channel_sub_order_id, "SUB1"); // sp1 matched
    assert.equal(tp1.split_remarks, "Ok"); // renamed column (was split_remakrs)
    const tp2 = rows.find((r) => r.channel_parent_order_id === "TP2");
    assert.equal(tp2.channel_sub_order_id, null); // LEFT JOIN, no split row
  });

  test("tata sales summary: revenue = Σ price × qty (A3 applies here too)", async () => {
    const [agg] = await salesRepo.tataCliqSummary(SALES);
    assert.equal(Number(agg.total_orders), 2);
    assert.equal(Number(agg.total_sale_value), 250); // 100*2 + 50*1
    assert.equal(Number(agg.total_tax), 25); // 10*2 + 5*1
    assert.equal(Number(agg.total_dispatched), 3);
  });

  test("tata sales exportStream: streams both rows with the renamed column", async () => {
    const stream = await salesRepo.tataCliqExportStream(SALES);
    const rows = [];
    for await (const row of stream) rows.push(row);
    assert.equal(rows.length, 2);
    assert.ok(rows.some((r) => r.split_remarks === "Ok"));
  });

  test("tata returns list: rw=1 dedup + sp1 sub-order id resolved", async () => {
    const rows = await returnsRepo.tataCliqList(RETURNS, RETURNS_SORT);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].return_order_item_id, "TROI1");
    assert.equal(rows[0].sp1_channel_sub_order_id, "SUB1");
    assert.equal(Number(rows[0].return_order_item_id_count), 1);
  });

  test("tata returns summary: count and forward value match the list", async () => {
    const [agg] = await returnsRepo.tataCliqSummary(RETURNS);
    assert.equal(Number(agg.total_returns), 1);
    assert.equal(Number(agg.forward_order_value), 100);
  });
}
