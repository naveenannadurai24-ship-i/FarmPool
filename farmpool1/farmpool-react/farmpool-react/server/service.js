/**
 * service.js — the app's business logic, kept free of HTTP so it can be
 * tested directly. api.js is just a thin HTTP layer over these functions.
 */
import { randomUUID } from "node:crypto";
import * as db from "./db.js";
import { BUYER_TYPES, CROPS, LOCATIONS, coordsOf } from "./catalog.js";
import { EPS, allocate, evaluateListings, selectPool } from "./matching.js";
import { isoDateTime } from "./dates.js";

export const FAIRNESS_MODES = ["equal", "proportional"];

export class NotFound extends Error {}
export class Conflict extends Error {}
export class Invalid extends Error {}

const r1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;
const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

/* ---------------------------------------------------------------- helpers */
const newId = (prefix) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 8)}`;

export const maskPhone = (phone) => phone.slice(0, 2) + "•".repeat(phone.length - 4) + phone.slice(-2);

function find(items, id, label) {
  const item = items.find((i) => i.id === id);
  if (!item) throw new NotFound(`${label} not found`);
  return item;
}

function checkCropLocation(crop, location) {
  if (!CROPS.includes(crop)) throw new Invalid(`Unknown crop: ${crop}`);
  if (!Object.hasOwn(LOCATIONS, location)) throw new Invalid(`Unknown location: ${location}`);
}

function checkFairness(fairness) {
  if (!FAIRNESS_MODES.includes(fairness)) {
    throw new Invalid(`fairness must be one of ${FAIRNESS_MODES.join(", ")}`);
  }
}

function publicListing(listing) {
  const { phone, ...rest } = listing;
  return { ...rest, phoneMasked: maskPhone(phone) };
}

function publicRequest(req) {
  return { ...req, remainingKg: r1(Math.max(0, req.quantityKg - req.filledKg)) };
}

/* --------------------------------------------------------------- listings */
export function listListings(crop) {
  const data = db.load();
  let items = data.listings.filter((l) => l.status === "open" && l.remainingKg > EPS);
  if (crop) items = items.filter((l) => l.crop === crop);
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return items.map(publicListing);
}

export function createListing(p) {
  checkCropLocation(p.crop, p.location);
  const quantity = r1(Number(p.quantityKg));
  const record = {
    id: newId("lst"),
    farmerName: p.farmerName,
    phone: p.phone,
    crop: p.crop,
    quantityKg: quantity,
    remainingKg: quantity,
    minPricePerKg: r2(Number(p.minPricePerKg)),
    location: p.location,
    availableFrom: p.availableFrom,
    status: "open",
    createdAt: isoDateTime(),
  };
  db.transaction((data) => { data.listings.push(record); });
  return publicListing(record);
}

/** Open orders this listing is eligible for. Shown to a farmer right after
 *  they list a harvest, so they see straight away who could buy it. */
export function listingMatches(listingId) {
  const data = db.load();
  const listing = find(data.listings, listingId, "Listing");
  const matches = [];
  for (const req of data.requests) {
    if (req.status !== "open" || req.crop !== listing.crop) continue;
    const { eligible } = evaluateListings(req, [listing], coordsOf, req.radiusKm);
    if (!eligible.length) continue;
    matches.push({
      requestId: req.id,
      buyerName: req.buyerName,
      buyerType: req.buyerType,
      location: req.location,
      crop: req.crop,
      remainingKg: r1(Math.max(0, req.quantityKg - req.filledKg)),
      offerPricePerKg: req.offerPricePerKg,
      neededBy: req.neededBy,
      distanceKm: r1(eligible[0].distanceKm),
    });
  }
  matches.sort((a, b) => a.distanceKm - b.distanceKm);
  return matches;
}

/* --------------------------------------------------------------- requests */
export function createRequest(p) {
  checkCropLocation(p.crop, p.location);
  if (!BUYER_TYPES.includes(p.buyerType)) throw new Invalid(`Unknown buyer type: ${p.buyerType}`);
  const record = {
    id: newId("req"),
    buyerName: p.buyerName,
    buyerType: p.buyerType,
    crop: p.crop,
    quantityKg: r1(Number(p.quantityKg)),
    filledKg: 0,
    offerPricePerKg: r2(Number(p.offerPricePerKg)),
    location: p.location,
    radiusKm: Math.trunc(Number(p.radiusKm)),
    neededBy: p.neededBy,
    status: "open",
    createdAt: isoDateTime(),
  };
  db.transaction((data) => { data.requests.push(record); });
  return publicRequest(record);
}

export function listRequests() {
  const data = db.load();
  const out = data.requests.map((req) => {
    const pub = publicRequest(req);
    if (req.status === "open") {
      const s = buildPool(data, req, req.radiusKm, "equal", false).summary;
      pub.coveragePct = s.fulfilledPct;
      pub.eligibleSupplyKg = s.eligibleSupplyKg;
      pub.shortfallKg = s.shortfallKg;
    } else {
      pub.coveragePct = 100;
      pub.eligibleSupplyKg = 0;
      pub.shortfallKg = 0;
    }
    return pub;
  });
  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first (stable)
  out.sort((a, b) => Number(a.status !== "open") - Number(b.status !== "open")); // open first
  return out;
}

/* ------------------------------------------------------------------ pools */
function buildPool(data, req, radiusKm, fairness, includePhone) {
  const demand = r1(Math.max(0, req.quantityKg - req.filledKg));
  const { eligible, excluded } = evaluateListings(req, data.listings, coordsOf, radiusKm);
  const { selected, standby } = selectPool(eligible, demand);

  const quantities = allocate(demand, selected.map((e) => e.listing.remainingKg), fairness);

  const allocations = [];
  selected.forEach((entry, i) => {
    const qty = quantities[i];
    if (qty < EPS) return;
    const l = entry.listing;
    allocations.push({
      listingId: l.id,
      farmerName: l.farmerName,
      village: l.location,
      phone: includePhone ? l.phone : maskPhone(l.phone),
      distanceKm: r1(entry.distanceKm),
      listingRemainingKg: l.remainingKg,
      qtyKg: qty,
      pricePerKg: req.offerPricePerKg,
      payout: r2(qty * req.offerPricePerKg),
    });
  });

  const filled = r1(allocations.reduce((s, a) => s + a.qtyKg, 0));
  allocations.forEach((a) => { a.sharePct = filled ? r1((100 * a.qtyKg) / filled) : 0; });

  for (const entry of standby) {
    const l = entry.listing;
    excluded.push({
      listingId: l.id,
      farmerName: l.farmerName,
      village: l.location,
      distanceKm: r1(entry.distanceKm),
      remainingKg: l.remainingKg,
      reason: "On standby: nearer farmers already cover this order",
      reasonCode: "standby",
      reasonParams: {},
    });
  }

  const weightedDistance = allocations.reduce((s, a) => s + a.distanceKm * a.qtyKg, 0);
  const summary = {
    demandKg: demand,
    filledKg: filled,
    shortfallKg: r1(Math.max(0, demand - filled)),
    fulfilledPct: demand > EPS ? r1((100 * filled) / demand) : 100,
    totalValue: r2(allocations.reduce((s, a) => s + a.payout, 0)),
    farmersCount: allocations.length,
    eligibleSupplyKg: r1(eligible.reduce((s, e) => s + e.listing.remainingKg, 0)),
    avgDistanceKm: filled ? r1(weightedDistance / filled) : 0,
  };
  return { allocations, excluded, summary };
}

export function previewPool(requestId, radiusKm = null, fairness = "equal") {
  checkFairness(fairness);
  const data = db.load();
  const req = find(data.requests, requestId, "Request");
  const radius = Math.trunc(radiusKm || req.radiusKm);
  const built = buildPool(data, req, radius, fairness, false);
  return { request: publicRequest(req), params: { radiusKm: radius, fairness }, ...built };
}

export function confirmPool(requestId, radiusKm = null, fairness = "equal") {
  checkFairness(fairness);
  return db.transaction((data) => {
    const req = find(data.requests, requestId, "Request");
    if (req.status === "fulfilled") throw new Conflict("This order is already fully pooled");
    const radius = Math.trunc(radiusKm || req.radiusKm);
    const built = buildPool(data, req, radius, fairness, true);
    if (!built.allocations.length) {
      throw new Conflict("No eligible farmers within range yet. Try a wider radius.");
    }

    const byId = new Map(data.listings.map((l) => [l.id, l]));
    for (const a of built.allocations) {
      const listing = byId.get(a.listingId);
      listing.remainingKg = r1(listing.remainingKg - a.qtyKg);
      if (listing.remainingKg <= EPS) {
        listing.remainingKg = 0;
        listing.status = "sold";
      }
    }

    req.filledKg = r1(req.filledKg + built.summary.filledKg);
    if (req.quantityKg - req.filledKg <= EPS) req.status = "fulfilled";

    const pool = {
      id: newId("pool"),
      requestId: req.id,
      buyerName: req.buyerName,
      buyerType: req.buyerType,
      crop: req.crop,
      deliveryLocation: req.location,
      offerPricePerKg: req.offerPricePerKg,
      neededBy: req.neededBy,
      fairness,
      radiusKm: radius,
      createdAt: isoDateTime(),
      allocations: built.allocations,
      summary: built.summary,
    };
    data.pools.unshift(pool);
    return pool;
  });
}

export const listPools = () => db.load().pools;

/* ------------------------------------------------------------------ stats */
export function stats() {
  const data = db.load();
  const open = data.listings.filter((l) => l.status === "open" && l.remainingKg > EPS);
  return {
    openOrders: data.requests.filter((r) => r.status === "open").length,
    openListings: open.length,
    availableKg: r1(open.reduce((s, l) => s + l.remainingKg, 0)),
    pooledKg: r1(data.pools.reduce((s, p) => s + p.summary.filledKg, 0)),
    pooledValue: r2(data.pools.reduce((s, p) => s + p.summary.totalValue, 0)),
  };
}
