"use strict";

const fs = require("fs");
const path = require("path");

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "..", "logs");

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function todayLogPath() {
  const day = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `api-${day}.log`);
}

function writeApiLog(entry) {
  try {
    ensureLogDir();
    fs.appendFile(
      todayLogPath(),
      `${JSON.stringify({ time: new Date().toISOString(), ...entry })}\n`,
      () => {},
    );
  } catch (err) {
    console.error("[FileLogger] Failed to write API log:", err.message);
  }
}

module.exports = { writeApiLog };
