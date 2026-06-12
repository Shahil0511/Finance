"use strict";

const { writeApiLog } = require("../utils/fileLogger");

const SLOW_REQUEST_MS = parseInt(process.env.SLOW_REQUEST_MS || "3000", 10);

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url } = req;
  const ip = req.ip || req.socket?.remoteAddress;
  const userAgent = req.get("user-agent") || "";

  res.on("finish", () => {
    const duration = Date.now() - start;
    const cache = res.getHeader("X-Cache") || "-";
    const source =
      res.getHeader("X-Data-Source") || res.locals.dataSource || "-";
    const status = res.statusCode;
    const slow = duration > SLOW_REQUEST_MS ? " SLOW" : "";

    console.log(
      `[HTTP] ${method} ${url} ${status} ${duration}ms source=${source} cache=${cache}${slow}`,
    );

    writeApiLog({
      method,
      api: req.originalUrl || url,
      path: req.path,
      status,
      durationMs: duration,
      source,
      cache,
      redis: res.locals.redisStatus || "-",
      dbQueries: res.locals.dbQueries || 0,
      slow: duration > SLOW_REQUEST_MS,
      ip,
      userAgent,
    });
  });

  next();
}

module.exports = { requestLogger };
