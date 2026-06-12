"use strict";

const fs = require("fs");
const path = require("path");

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "..", "logs");

// Memoized so the synchronous mkdir runs once, not on every request
// (it used to block the event loop on each res 'finish').
let logDirReady = false;
function ensureLogDir() {
  if (logDirReady) return;
  fs.mkdirSync(LOG_DIR, { recursive: true });
  logDirReady = true;
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
      (err) => {
        if (err) {
          logDirReady = false; // dir may have been removed — recreate next time
          console.error("[FileLogger] Failed to write API log:", err.message);
        }
      },
    );
  } catch (err) {
    logDirReady = false;
    console.error("[FileLogger] Failed to write API log:", err.message);
  }
}

module.exports = { writeApiLog };
