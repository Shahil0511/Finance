"use strict";

const { createClient } = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://host.docker.internal:6379";
const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || "finance-tool";
const MAX_RETRY_DELAY_MS = 10_000;
const CONNECT_TIMEOUT_MS = parseInt(
  process.env.REDIS_CONNECT_TIMEOUT_MS || "5000",
  10,
);

let client = null;
let isReady = false;
let everConnected = false;
let connectAttempts = 0;
let lastError = null;

const startedAt = Date.now();
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  errors: 0,
};

function namespaced(key) {
  return key.startsWith(`${REDIS_KEY_PREFIX}:`)
    ? key
    : `${REDIS_KEY_PREFIX}:${key}`;
}

function createRedisClient() {
  const c = createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: CONNECT_TIMEOUT_MS,
      reconnectStrategy(retries) {
        connectAttempts = retries;
        // Until the FIRST successful connect, give up after a few attempts so
        // connect() rejects and the app boots cache-less — otherwise the
        // returned delay keeps the connect() promise pending forever and a
        // Redis outage at boot time hangs server startup indefinitely.
        if (!everConnected && retries >= 3) {
          return new Error("Redis unreachable at startup");
        }
        const delay = Math.min(100 * 2 ** retries, MAX_RETRY_DELAY_MS);
        console.warn(`[Redis] Reconnect attempt #${retries + 1} in ${delay}ms`);
        return delay;
      },
    },
  });

  c.on("connect", () => console.log("[Redis] Connecting"));
  c.on("ready", () => {
    isReady = true;
    everConnected = true; // post-boot outages now retry patiently forever
    lastError = null;
    console.log("[Redis] Ready");
  });
  c.on("end", () => {
    isReady = false;
    console.warn("[Redis] Connection closed");
  });
  c.on("error", (err) => {
    isReady = false;
    lastError = err.message;
    stats.errors++;
    if (connectAttempts <= 1) console.error("[Redis] Error:", err.message);
  });
  c.on("reconnecting", () => {
    isReady = false;
  });

  return c;
}

async function connect() {
  if (client) return client;
  client = createRedisClient();
  try {
    await client.connect();
  } catch (err) {
    lastError = err.message;
    stats.errors++;
    console.error(
      "[Redis] Initial connection failed, running without cache:",
      err.message,
    );
  }
  return client;
}

function available() {
  return isReady && client !== null;
}

function getClient() {
  return available() ? client : null;
}

async function getCache(key) {
  if (!available()) return null;
  try {
    const raw = await client.get(namespaced(key));
    if (raw === null) {
      stats.misses++;
      console.debug(`[Redis] MISS ${key}`);
      return null;
    }
    stats.hits++;
    console.debug(`[Redis] HIT ${key}`);
    return JSON.parse(raw);
  } catch (err) {
    stats.errors++;
    console.error(`[Redis] getCache error for "${key}":`, err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 120) {
  if (!available()) return false;
  try {
    await client.set(namespaced(key), JSON.stringify(value), {
      EX: ttlSeconds,
    });
    stats.sets++;
    console.debug(`[Redis] SET ${key} TTL=${ttlSeconds}s`);
    return true;
  } catch (err) {
    stats.errors++;
    console.error(`[Redis] setCache error for "${key}":`, err.message);
    return false;
  }
}

function health() {
  const hitTotal = stats.hits + stats.misses;
  return {
    status: available() ? "connected" : "unavailable",
    keyPrefix: REDIS_KEY_PREFIX,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    reconnectAttempts: connectAttempts,
    lastError,
    stats: {
      ...stats,
      hitRate: hitTotal ? Number((stats.hits / hitTotal).toFixed(4)) : null,
    },
  };
}

async function close() {
  if (!client) return;
  try {
    await client.quit();
  } finally {
    client = null;
    isReady = false;
  }
}

module.exports = {
  connect,
  close,
  available,
  getClient,
  getCache,
  setCache,
  health,
  namespaced,
};
