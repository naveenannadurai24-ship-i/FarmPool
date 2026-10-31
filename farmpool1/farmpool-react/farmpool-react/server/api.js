/**
 * api.js — the HTTP layer. Each route validates its input and hands off to
 * service.js, which holds the real logic. Plain Node, no framework.
 *
 * Validation errors use the shape { detail: [{ loc: ["body", "phone"], msg }] }
 * with status 422; other errors use { detail: "message" } with 400/404/409.
 * The frontend understands both.
 */
import * as service from "./service.js";
import { BUYER_TYPES, CROPS, LOCATIONS } from "./catalog.js";
import { isoDate, isValidIsoDate } from "./dates.js";

const MAX_BODY_BYTES = 100_000;

class HttpError extends Error {
  constructor(status, detail) {
    super(typeof detail === "string" ? detail : "Validation error");
    this.status = status;
    this.detail = detail;
  }
}

/* ------------------------------------------------------------- validation */
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const bad = (errors, where, name, msg) => errors.push({ loc: [where, name], msg });

function text(errors, b, name, min, max) {
  const v = typeof b[name] === "string" ? b[name].trim() : "";
  if (v.length < min || v.length > max) {
    bad(errors, "body", name, `String should have between ${min} and ${max} characters`);
  }
  return v;
}
function oneOf(errors, b, name, allowed, label) {
  if (!allowed.includes(b[name])) bad(errors, "body", name, `Choose a ${label} from the list`);
  return b[name];
}
function number(errors, b, name, { min, max, exclusiveMin = false }) {
  const v = b[name];
  const ok = isNum(v) && (exclusiveMin ? v > min : v >= min) && v <= max;
  if (!ok) bad(errors, "body", name, `Number should be ${exclusiveMin ? "greater than" : "at least"} ${min} and at most ${max}`);
  return v;
}
function date(errors, b, name) {
  if (!isValidIsoDate(b[name])) bad(errors, "body", name, "Enter a valid date (YYYY-MM-DD)");
  return b[name];
}
function radius(errors, raw, where, name, required) {
  if (raw === undefined || raw === null || raw === "") {
    if (required) bad(errors, where, name, "Field required");
    return undefined;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 10 || n > 1000) {
    bad(errors, where, name, "Input should be a whole number from 10 to 1000");
    return undefined;
  }
  return n;
}
function fairness(errors, raw, where) {
  if (raw === undefined || raw === null || raw === "") return "equal";
  if (!service.FAIRNESS_MODES.includes(raw)) {
    bad(errors, where, "fairness", "Input should be 'equal' or 'proportional'");
    return "equal";
  }
  return raw;
}
function finish(errors, value) {
  if (errors.length) throw new HttpError(422, errors);
  return value;
}

function validateListing(b) {
  const e = [];
  const value = {
    farmerName: text(e, b, "farmerName", 2, 60),
    phone: typeof b.phone === "string" ? b.phone.trim() : "",
    crop: oneOf(e, b, "crop", CROPS, "crop"),
    quantityKg: number(e, b, "quantityKg", { min: 1, max: 100000 }),
    minPricePerKg: number(e, b, "minPricePerKg", { min: 0, max: 10000, exclusiveMin: true }),
    location: oneOf(e, b, "location", Object.keys(LOCATIONS), "location"),
    availableFrom: date(e, b, "availableFrom"),
  };
  if (!/^[6-9][0-9]{9}$/.test(value.phone)) bad(e, "body", "phone", "Enter a 10-digit Indian mobile number");
  return finish(e, value);
}

function validateRequest(b) {
  const e = [];
  const value = {
    buyerName: text(e, b, "buyerName", 2, 60),
    buyerType: oneOf(e, b, "buyerType", BUYER_TYPES, "buyer type"),
    crop: oneOf(e, b, "crop", CROPS, "crop"),
    quantityKg: number(e, b, "quantityKg", { min: 1, max: 100000 }),
    offerPricePerKg: number(e, b, "offerPricePerKg", { min: 0, max: 10000, exclusiveMin: true }),
    location: oneOf(e, b, "location", Object.keys(LOCATIONS), "location"),
    radiusKm: radius(e, b.radiusKm, "body", "radiusKm", false) ?? 150,
    neededBy: date(e, b, "neededBy"),
  };
  if (isValidIsoDate(value.neededBy) && value.neededBy < isoDate()) {
    bad(e, "body", "neededBy", "Needed-by date can't be in the past");
  }
  return finish(e, value);
}

function validateConfirm(b) {
  const e = [];
  const value = {
    radiusKm: radius(e, b.radiusKm, "body", "radiusKm", false) ?? null,
    fairness: fairness(e, b.fairness, "body"),
  };
  return finish(e, value);
}

function validatePreviewQuery(query) {
  const e = [];
  const value = {
    radiusKm: radius(e, query.get("radius_km"), "query", "radius_km", false) ?? null,
    fairness: fairness(e, query.get("fairness"), "query"),
  };
  return finish(e, value);
}

/* ----------------------------------------------------------------- routes */
const reply = (data, status = 200) => ({ status, data });

const routes = [
  ["GET", /^\/api\/meta$/, () => reply({
    crops: CROPS,
    buyerTypes: BUYER_TYPES,
    locations: Object.entries(LOCATIONS).map(([name, [lat, lng]]) => ({ name, lat, lng })),
  })],
  ["GET", /^\/api\/stats$/, () => reply(service.stats())],
  ["GET", /^\/api\/listings$/, ({ query }) => reply(service.listListings(query.get("crop") || undefined))],
  ["POST", /^\/api\/listings$/, ({ body }) => reply(service.createListing(validateListing(body)), 201)],
  ["GET", /^\/api\/listings\/([\w-]+)\/matches$/, ({ params }) => reply(service.listingMatches(params[0]))],
  ["GET", /^\/api\/requests$/, () => reply(service.listRequests())],
  ["POST", /^\/api\/requests$/, ({ body }) => reply(service.createRequest(validateRequest(body)), 201)],
  ["GET", /^\/api\/requests\/([\w-]+)\/pool$/, ({ params, query }) => {
    const q = validatePreviewQuery(query);
    return reply(service.previewPool(params[0], q.radiusKm, q.fairness));
  }],
  ["POST", /^\/api\/requests\/([\w-]+)\/confirm$/, ({ params, body }) => {
    const c = validateConfirm(body);
    return reply(service.confirmPool(params[0], c.radiusKm, c.fairness), 201);
  }],
  ["GET", /^\/api\/pools$/, () => reply(service.listPools())],
];

/* ---------------------------------------------------------------- plumbing */
function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) { reject(new HttpError(413, "Request body too large")); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8").trim();
      if (!raw) return resolve({});
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          return reject(new HttpError(400, "Body must be a JSON object"));
        }
        resolve(parsed);
      } catch {
        reject(new HttpError(400, "Body is not valid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

export async function handleApi(req, res, url) {
  try {
    let pathMatched = false;
    for (const [method, pattern, handler] of routes) {
      const m = url.pathname.match(pattern);
      if (!m) continue;
      pathMatched = true;
      if (method !== req.method) continue;
      const body = method === "POST" ? await readJson(req) : {};
      const { status, data } = handler({ params: m.slice(1), query: url.searchParams, body });
      return send(res, status, data);
    }
    throw pathMatched ? new HttpError(405, "Method not allowed") : new HttpError(404, "Not Found");
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { detail: err.detail });
    if (err instanceof service.NotFound) return send(res, 404, { detail: err.message });
    if (err instanceof service.Conflict) return send(res, 409, { detail: err.message });
    if (err instanceof service.Invalid) return send(res, 400, { detail: err.message });
    console.error(err);
    return send(res, 500, { detail: "Internal server error" });
  }
}
