"use strict";

// End-to-end smoke test: boots the real Express server against the test
// Postgres and exercises health, API 404 handling, summary JSON, and the
// streamed CSV export over actual HTTP.
//   TEST_DATABASE_URL=postgres://test:test@localhost:5544/finance_test npm run test:integration
// Skipped (never connects, never spawns) when TEST_DATABASE_URL is unset.

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  test("server e2e (skipped — set TEST_DATABASE_URL to run)", { skip: true }, () => {});
} else {
  const u = new URL(TEST_DATABASE_URL);
  const PORT = 4571;
  const BASE = `http://127.0.0.1:${PORT}`;
  let child;
  let redisUp = false; // set in before() from /health; cache tests skip without it

  const read = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");

  before(async () => {
    const { Client } = require("pg");
    const admin = new Client({ connectionString: TEST_DATABASE_URL });
    await admin.connect();
    await admin.query(read("schema.sql"));
    await admin.query(read("seed.sales.sql")); // sales seeded; returns tables empty
    await admin.end();

    child = spawn(process.execPath, ["server.js"], {
      cwd: path.join(__dirname, "..", ".."),
      env: {
        ...process.env,
        PORT: String(PORT),
        DB_HOST: u.hostname,
        DB_PORT: u.port || "5432",
        DB_NAME: u.pathname.replace(/^\//, ""),
        DB_USER: decodeURIComponent(u.username),
        DB_PASSWORD: decodeURIComponent(u.password),
        DB_SSL: "false",
        // Real Redis when the harness provides one (docker-compose.test.yml /
        // CI service); otherwise an unroutable port so the app boots
        // cache-less fast and the cache test self-skips.
        REDIS_URL: process.env.TEST_REDIS_URL || "redis://127.0.0.1:1",
        REDIS_CONNECT_TIMEOUT_MS: "1000",
        NODE_ENV: "production",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("server did not start within 20s")),
        20_000,
      );
      child.stdout.on("data", (d) => {
        if (String(d).includes("Finance Tool backend")) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.on("exit", (code) =>
        reject(new Error(`server exited before listening (code ${code})`)),
      );
    });

    const health = await fetch(`${BASE}/health`).then((r) => r.json());
    redisUp = health.redis?.status === "connected";
  });

  after(() => {
    child?.kill();
  });

  test("GET /health reports db status", async () => {
    const res = await fetch(`${BASE}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(body.db, "ok");
  });

  test("unmatched API path returns JSON 404, not the SPA", async () => {
    const res = await fetch(`${BASE}/api/definitely-not-a-route`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get("content-type"), /application\/json/);
    assert.deepEqual(await res.json(), { error: "Not found" });
  });

  test("GET /api/sales/summary returns the corrected revenue over HTTP", async () => {
    const res = await fetch(
      `${BASE}/api/sales/summary?dateFrom=2000-01-01&dateTo=2100-01-01&salesChannel=MYNTRA`,
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(Number(body.total_sale_value), 600); // A3: price × qty
    assert.equal(Number(body.total_orders), 2);
  });

  test("GET /api/sales/export streams a CSV attachment (header + 3 rows)", async () => {
    const res = await fetch(
      `${BASE}/api/sales/export?dateFrom=2000-01-01&dateTo=2100-01-01&salesChannel=MYNTRA`,
    );
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/csv/);
    assert.match(res.headers.get("content-disposition"), /attachment; filename="b2c_sales_/);
    const lines = (await res.text()).split("\n");
    assert.equal(lines.length, 4); // header + 3 seeded rows
    assert.match(lines[0], /^channel_parent_order_id,/);
  });

  test("empty export returns a header-only CSV (B2 behavior)", async () => {
    const res = await fetch(
      `${BASE}/api/returns/export?dateFrom=2000-01-01&dateTo=2100-01-01`,
    );
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/csv/);
    const lines = (await res.text()).split("\n");
    assert.equal(lines.length, 1); // header only — returns tables are empty
    assert.match(lines[0], /^warehouse_name,/);
  });

  test("GET /api/sales/analytics returns chart buckets over HTTP", async () => {
    const res = await fetch(
      `${BASE}/api/sales/analytics?dateFrom=2000-01-01&dateTo=2100-01-01&salesChannel=MYNTRA`,
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.daily.length, 1);
    assert.equal(Number(body.daily[0].revenue), 600);
    assert.equal(body.byChannel[0].key, "MYNTRA");
    assert.equal(body.byPayment.length, 2); // PREPAID + COD
  });

  test("Refresh (Cache-Control: no-cache) bypasses and REWRITES the Redis cache", async (t) => {
    if (!redisUp) return t.skip("redis not available in this environment");
    // Unique param -> unique cache key, isolated from the other tests.
    const url = `${BASE}/api/sales/summary?dateFrom=2000-01-01&dateTo=2100-01-01&salesChannel=MYNTRA&_cb=refresh-test`;

    const first = await fetch(url); // cold -> queries DB, fills cache
    assert.equal(first.headers.get("x-cache"), "MISS");

    const second = await fetch(url); // warm -> served from Redis
    assert.equal(second.headers.get("x-cache"), "HIT");

    // The dashboard Refresh button: skip the read, query fresh, overwrite.
    const third = await fetch(url, { headers: { "cache-control": "no-cache" } });
    assert.equal(third.headers.get("x-cache"), "REFRESH");
    assert.equal(Number((await third.json()).total_sale_value), 600);

    const fourth = await fetch(url); // the rewritten entry serves again
    assert.equal(fourth.headers.get("x-cache"), "HIT");
    assert.equal(Number((await fourth.json()).total_sale_value), 600);
  });

  test("invalid date param returns a 400 with the public message", async () => {
    const res = await fetch(`${BASE}/api/sales/summary?dateFrom=junk`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /Invalid dateFrom/);
  });
}
