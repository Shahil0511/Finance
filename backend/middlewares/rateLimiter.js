"use strict";

const rateLimit = require("express-rate-limit");
const { available, getClient, namespaced } = require("../db/redis");

const INCREMENT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
if ttl < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return { current, ttl }
`;

const DECREMENT_SCRIPT = `
local current = redis.call("DECR", KEYS[1])
if current <= 0 then
  redis.call("DEL", KEYS[1])
end
return current
`;

class RedisRateLimitStore {
  constructor({ prefix = "rl:" } = {}) {
    this.prefix = prefix;
    this.windowMs = 60_000;
    this.localKeys = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  key(key) {
    return namespaced(`${this.prefix}${key}`);
  }

  async increment(key) {
    const client = getClient();
    if (!client) throw new Error("Redis is not available");

    const result = await client.eval(INCREMENT_SCRIPT, {
      keys: [this.key(key)],
      arguments: [String(this.windowMs)],
    });
    const totalHits = Number(result[0]);
    const ttl = Number(result[1]);

    return {
      totalHits,
      resetTime: new Date(Date.now() + Math.max(ttl, 0)),
    };
  }

  async decrement(key) {
    const client = getClient();
    if (!client) return;
    await client.eval(DECREMENT_SCRIPT, {
      keys: [this.key(key)],
      arguments: [],
    });
  }

  async resetKey(key) {
    const client = getClient();
    if (!client) return;
    await client.del(this.key(key));
  }

  async resetAll() {
    const client = getClient();
    if (!client) return;

    for await (const key of client.scanIterator({
      MATCH: this.key("*"),
      COUNT: 200,
    })) {
      await client.del(key);
    }
  }
}

function buildRedisStore() {
  if (!available()) return null;
  return new RedisRateLimitStore({
    prefix: process.env.RATE_LIMIT_REDIS_PREFIX || "rl:",
  });
}

async function createRateLimiter({
  windowMs = 60_000,
  max = 200,
  message = { error: "Too many requests, please slow down." },
} = {}) {
  const store = buildRedisStore();
  console.log(
    store ? "[RateLimit] Using Redis-backed store" : "[RateLimit] Using in-memory store",
  );

  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    ...(store ? { store } : {}),
  });
}

// RedisRateLimitStore is intentionally NOT exported: it is an internal detail
// instantiated only by buildRedisStore() above. Nothing outside this module
// references it (verified repo-wide), so keeping it private tightens the
// surface a reader has to reason about.
module.exports = { createRateLimiter };
