/**
 * db.js — a tiny JSON-file "database" so the project runs with zero setup.
 * Swap it for SQLite/PostgreSQL in a real deployment.
 *
 * Node runs one request handler at a time, and everything here is
 * synchronous, so a load -> change -> save cycle can't be interleaved with
 * another request. Writes go to a temp file and are swapped in, so a crash
 * mid-write can't leave a half-written db.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSeed } from "./seed.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// Read at call time so tests can point it at a throwaway file.
export const dbFile = () => process.env.FARMPOOL_DB || path.join(here, "..", "db.json");

function write(data) {
  const file = dbFile();
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  // On Windows (especially inside a OneDrive folder) the swap can fail for a
  // moment if another program is touching the file, so retry briefly.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (err) {
      if (err.code !== "EPERM" && err.code !== "EBUSY") throw err;
      const until = Date.now() + 100 * (attempt + 1);
      while (Date.now() < until) { /* brief wait */ }
    }
  }
  fs.renameSync(tmp, file);
}

export function load() {
  const file = dbFile();
  if (!fs.existsSync(file)) {
    const data = buildSeed();
    write(data);
    return data;
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

/** Load the data, let `fn` change it, then save. If `fn` throws, nothing is saved. */
export function transaction(fn) {
  const data = load();
  const result = fn(data);
  write(data);
  return result;
}
