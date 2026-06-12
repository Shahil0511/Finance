"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");

const appConfig = require("./config/appConfig");
const redis = require("./db/redis");
const { testConnection, end: closePool, query: pgQuery } = require("./db/postgres");
const { requestContext } = require("./middlewares/requestContext");
const { requestLogger } = require("./middlewares/requestLogger");
const { attachRequestSignal } = require("./middlewares/requestSignal");
const { errorHandler } = require("./middlewares/errorHandler");
const { createRateLimiter } = require("./middlewares/rateLimiter");

const salesRoutes = require("./routes/sales");
const returnsRoutes = require("./routes/returns");

const app = express();
const PORT = appConfig.port;
const basePath = appConfig.basePath;

// ─── Compression (gzip/brotli) ────────────────────────────────────────────────
// Must come before routes so all responses are compressed.
// Skips already-compressed content-types automatically.
app.use(
  compression({
    level: 6, // balanced speed vs ratio
    threshold: 1024, // skip tiny responses
  }),
);

// ─── Trust proxy ──────────────────────────────────────────────────────────────
// Behind a reverse proxy (Nginx/IIS), trust X-Forwarded-* so req.ip is the real
// client and per-client rate limiting works. Set TRUST_PROXY to the hop count.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  app.set("trust proxy", /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Default: no cross-origin access (the SPA is served same-origin). Set CORS_ORIGIN
// to explicitly allow a specific cross-origin client.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || false,
    methods: ["GET"],
  }),
);

app.use(express.json());

// ─── Observability ────────────────────────────────────────────────────────────
app.use(requestContext);
app.use(requestLogger);
app.use(attachRequestSignal);

// ─── Health (no auth, no rate limit) ─────────────────────────────────────────
// Always 200 while the process is up (the DB is external — an outage there
// shouldn't make orchestrators kill the app); db/redis fields carry the detail.
app.get("/health", async (_req, res) => {
  let db = "ok";
  try {
    await Promise.race([
      pgQuery("SELECT 1"),
      new Promise((_, reject) => {
        const t = setTimeout(() => reject(new Error("health probe timeout")), 2000);
        t.unref();
      }),
    ]);
  } catch {
    db = "unavailable";
  }
  res.json({
    status: "ok",
    db,
    timestamp: new Date().toISOString(),
    redis: redis.health(),
  });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  // Connect Redis (non-blocking — app runs fine without it)
  await redis.connect();

  // Verify Postgres reachability. Non-fatal (the external DB may come up later;
  // /health reports live status) but loud, so a misconfig is obvious at boot.
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error(
      "[Startup] WARNING: PostgreSQL is unreachable — every report query will fail " +
        "until it is. Check the DB_* values in backend/.env.",
    );
  }

  // Build rate limiter after Redis is connected (so it can use Redis store)
  const limiter = await createRateLimiter({
    windowMs: 60_000,
    max: parseInt(process.env.RATE_LIMIT_MAX || "200", 10),
  });
  app.use(`${basePath}/api/`, limiter);
  app.use("/api/", limiter);

  // API route access is controlled upstream by Data Nexus/session cookies.
  app.use(`${basePath}/api/sales`, salesRoutes);
  app.use(`${basePath}/api/returns`, returnsRoutes);
  app.use("/api/sales", salesRoutes);
  app.use("/api/returns", returnsRoutes);

  // Unmatched API paths get a JSON 404 instead of falling through to the SPA
  // catch-all (which would return index.html for a mistyped API URL).
  app.use([`${basePath}/api`, "/api"], (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // ─── Serve React frontend in production ───────────────────────────────────
  const frontendPath = path.join(__dirname, "public");
  app.use(
    `${basePath}`,
    express.static(frontendPath, {
      maxAge: "1d", // static assets cached by browser
      etag: true,
    }),
  );
  app.get(`${basePath}/*`, (_req, res) => {
    const indexPath = path.join(frontendPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err)
        res.status(404).json({
          error: "Frontend not found. Run npm run build in /frontend first.",
        });
    });
  });

  // Error handler is registered LAST so it catches errors from every route above.
  app.use(errorHandler);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n Finance Tool backend  →  http://0.0.0.0:${PORT}`);
    console.log(
      ` Redis                 →  ${process.env.REDIS_URL || "redis://host.docker.internal:6379"}`,
    );
    console.log(` DB host               →  ${process.env.DB_HOST}`);
    console.log(` Health                →  http://localhost:${PORT}/health\n`);
  });
  async function shutdown(signal) {
    console.log(`[Server] ${signal} received, shutting down`);
    // Force-exit guard so a hung connection can't block shutdown forever.
    const forceExit = setTimeout(() => {
      console.error("[Server] Forced exit after 10s");
      process.exit(1);
    }, 10_000);
    forceExit.unref();
    server.close(async () => {
      try { await redis.close(); } catch {}
      try { await closePool(); } catch {}
      clearTimeout(forceExit);
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
