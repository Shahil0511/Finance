const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,

  // Pool settings
  max: 20,
  min: 2,

  // Fail fast if pool is exhausted — prevents HTTP connections piling up while waiting
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 12000,

  // Query timeout
  statement_timeout: 600000,
  query_timeout: 600000,

  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,

  // Raise work_mem so large sorts/hashes (DISTINCT ON, ROW_NUMBER, hash joins)
  // stay in RAM instead of spilling to disk. 64 MB × 20 connections = 1.28 GB max.
  options: "-c work_mem=64MB",
});

pool.on("error", (err) => {
  console.error("[PostgreSQL] Unexpected client error:", err.message);
});

async function query(sql, params = [], signal) {
  if (signal?.aborted) throw Object.assign(new Error('Request aborted'), { code: 'CANCELLED' });

  const client = await pool.connect();
  let cancelled = false;
  let clientError = null;
  let queryError = null;

  const onClientError = (err) => {
    clientError = err;
    console.error("[PostgreSQL] Active client error:", err.message);
  };

  client.on("error", onClientError);

  const onAbort = () => {
    cancelled = true;
    // Cancel the running query via a separate connection (fire-and-forget)
    const pid = client.processID;
    if (pid) {
      pool.connect()
        .then((c) => c.query('SELECT pg_cancel_backend($1)', [pid]).finally(() => c.release()))
        .catch(() => {});
    }
  };

  if (signal) signal.addEventListener('abort', onAbort, { once: true });

  try {
    const start = Date.now();
    const result = await client.query(sql, params);
    const duration = Date.now() - start;
    if (duration > 5000) console.log(`[PostgreSQL] Slow query (${duration}ms)`);
    return result.rows;
  } catch (err) {
    queryError = err;
    if (cancelled) throw Object.assign(new Error('Request aborted'), { code: 'CANCELLED' });
    console.error('[PostgreSQL Query Error]', err.message);
    throw err;
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
    client.removeListener("error", onClientError);
    const shouldDestroyClient =
      clientError ||
      queryError?.message?.toLowerCase().includes("connection terminated");
    client.release(shouldDestroyClient ? clientError || queryError : undefined);
  }
}

/** Call at the top of every route handler. Returns { signal } and wires abort on client disconnect. */
function makeRequestSignal(req) {
  const ac = new AbortController();
  req.on('close', () => ac.abort());
  return ac.signal;
}

async function testConnection() {
  try {
    await query("SELECT 1");

    console.log("[PostgreSQL] Connected successfully");

    return true;
  } catch (err) {
    console.error("[PostgreSQL] Connection failed:", err.message);

    return false;
  }
}

async function end() {
  await pool.end();
}

module.exports = { query, testConnection, makeRequestSignal, end };
