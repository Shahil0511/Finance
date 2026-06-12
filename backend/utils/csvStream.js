"use strict";

const { once } = require("events");
const { csvHeader, csvRow } = require("./csv");

/**
 * Streams query rows to the response as a CSV download instead of buffering
 * the whole result set in memory (REFACTOR_PLAN.md B2).
 *
 * The first row is pulled BEFORE any header is written, so a query error
 * (bad SQL, connection failure) still propagates to the JSON error handler
 * as a proper 500. Once bytes are on the wire we can't change the status —
 * a mid-stream error destroys the socket so the client sees a failed
 * download rather than a silently truncated file.
 *
 * An empty result produces a header-only CSV.
 */
async function streamCsvExport(res, stream, columns, filename) {
  const iterator = stream[Symbol.asyncIterator]();

  let first;
  try {
    first = await iterator.next();
  } catch (err) {
    stream.destroy?.();
    throw err; // headers not sent yet → errorHandler returns JSON
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  // Stop the DB cursor if the client disconnects mid-download.
  res.on("close", () => stream.destroy?.());

  const write = async (chunk) => {
    if (!res.write(chunk)) await once(res, "drain");
  };

  try {
    await write(csvHeader(columns));
    if (!first.done) {
      await write(`\n${csvRow(first.value, columns)}`);
      for (;;) {
        const { value, done } = await iterator.next();
        if (done) break;
        await write(`\n${csvRow(value, columns)}`);
      }
    }
    res.end();
  } catch (err) {
    if (err?.code !== "CANCELLED") {
      console.error("[CSV Export] Stream failed mid-download:", err.message);
    }
    res.destroy(err?.code === "CANCELLED" ? undefined : err);
  }
}

module.exports = { streamCsvExport };
