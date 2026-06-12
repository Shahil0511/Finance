"use strict";

const crypto = require("crypto");
const redis = require("../db/redis");
const { getCache, setCache } = redis;

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function hashParams(obj) {
  return crypto
    .createHash("sha1")
    .update(stableStringify(obj))
    .digest("hex")
    .slice(0, 16);
}

const inFlight = new Map();

function cacheMiddleware({ keyFn, ttl = 120 }) {
  return async (req, res, next) => {
    if (req.method !== "GET" || req.headers["cache-control"] === "no-store") {
      res.locals.dataSource = "db";
      res.locals.redisStatus = redis.available() ? "bypass" : "unavailable";
      return next();
    }

    const key = typeof keyFn === "function" ? keyFn(req) : keyFn;
    const safeTtl = Math.max(1, parseInt(ttl, 10) || 120);
    res.locals.cacheKey = key;
    res.locals.redisStatus = redis.available() ? "available" : "unavailable";

    const cached = await getCache(key);
    if (cached !== null) {
      res.locals.dataSource = "redis";
      res.locals.redisStatus = "hit";
      res.setHeader("X-Cache", "HIT");
      res.setHeader("X-Data-Source", "redis");
      res.setHeader("Cache-Control", `private, max-age=${safeTtl}`);
      res.setHeader("Vary", "Cookie");
      return res.json(cached);
    }

    if (inFlight.has(key)) {
      try {
        const data = await inFlight.get(key);
        res.locals.dataSource = "memory-dedup";
        res.locals.redisStatus = "dedup";
        res.setHeader("X-Cache", "DEDUP");
        res.setHeader("X-Data-Source", "memory-dedup");
        return res.json(data);
      } catch {
        // The original request was aborted or failed, so this request will query DB.
      }
    }

    res.locals.__cacheKey = key;
    res.locals.__cacheTtl = safeTtl;
    res.locals.dataSource = "db";
    res.locals.redisStatus = redis.available() ? "miss" : "unavailable";

    const origJson = res.json.bind(res);
    let settled = false;
    let resolveInFlight;
    let rejectInFlight;
    const promise = new Promise((resolve, reject) => {
      resolveInFlight = resolve;
      rejectInFlight = reject;
    });
    inFlight.set(key, promise);

    const rejectPending = (message) => {
      if (settled) return;
      settled = true;
      inFlight.delete(key);
      rejectInFlight(new Error(message));
    };

    res.json = async (body) => {
      if (!settled) {
        settled = true;
        inFlight.delete(key);
        resolveInFlight(body);
      }

      if (!res.headersSent) {
        res.setHeader("X-Cache", "MISS");
        res.setHeader("X-Data-Source", "db");
        res.setHeader("Cache-Control", `private, max-age=${safeTtl}`);
        res.setHeader("Vary", "Cookie");
      }

      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, safeTtl).catch(() => {});
      }

      return origJson(body);
    };

    res.on("finish", () => {
      if (!settled) rejectPending("Response finished without json()");
    });
    res.on("close", () => {
      if (!settled) rejectPending("Response closed before json()");
    });
    req.on("aborted", () => {
      if (!settled) rejectPending("Request aborted before json()");
    });

    next();
  };
}

module.exports = { cacheMiddleware, hashParams };
