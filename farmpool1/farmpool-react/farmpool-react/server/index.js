/**
 * index.js — FarmPool server. Serves the API and the built React app
 * from one place, using only Node's built-in modules (no npm packages).
 *
 *   npm start      builds the frontend, then runs this
 *   open http://localhost:4300
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { handleApi } from "./api.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(here, "..", "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function plain(res, status, message) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}

function serveStatic(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return plain(res, 400, "Bad request");
  }
  if (rel === "/") rel = "/index.html";
  const file = path.resolve(PUBLIC_DIR, "." + rel);
  // Never serve anything outside /public (blocks ../ tricks).
  if (file !== PUBLIC_DIR && !file.startsWith(PUBLIC_DIR + path.sep)) return plain(res, 403, "Forbidden");

  fs.readFile(file, (err, data) => {
    if (err) return plain(res, 404, "Not Found");
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  });
}

export function createApp() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") return plain(res, 405, "Method not allowed");
    return serveStatic(req, res, url.pathname);
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const port = Number(process.env.PORT) || 4300;
  createApp().listen(port, () => {
    console.log(`FarmPool running at http://localhost:${port}`);
  });
}
