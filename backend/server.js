"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");

const appConfig = require("./config/appConfig");
const redis = require("./db/redis");
const { testConnection } = require("./db/postgres");
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

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET"],
  }),
);

app.use(express.json());

// ─── Observability ────────────────────────────────────────────────────────────
app.use(requestContext);
app.use(requestLogger);
app.use(attachRequestSignal);

// ─── Health (no auth, no rate limit) ─────────────────────────────────────────
app.get("/health", async (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    redis: redis.health(),
  });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  // Connect Redis (non-blocking — app runs fine without it)
  await redis.connect();

  // Verify Postgres reachability
  await testConnection();

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
  app.use(errorHandler);

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
    server.close(async () => {
      await redis.close();
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
