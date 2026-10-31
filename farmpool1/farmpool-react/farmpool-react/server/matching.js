/**
 * matching.js — the pooling algorithm. Pure functions: no files, no HTTP,
 * so every rule here can be unit-tested on its own.
 *
 * The problem: a buyer needs, say, 450 kg of tomatoes. No single small
 * farmer has that much. Four farmers nearby have 90, 220, 60 and 140 kg.
 * How do we (1) pick who is in the pool, and (2) split the order fairly?
 *
 * Step 1 — ELIGIBILITY (evaluateListings)
 *   A listing is eligible only if it is the same crop, still has stock, its
 *   minimum price is at or below the buyer's offer, it is ready by the
 *   needed-by date, and it is within the buyer's delivery radius
 *   (straight-line distance, haversine formula). Every listing that fails
 *   gets a reason CODE plus parameters, so the UI can explain itself in the
 *   user's language.
 *
 * Step 2 — POOL SELECTION (selectPool)
 *   Take eligible farmers nearest-first until their combined stock covers
 *   the demand. Nearest-first keeps pickup distance (and so transport cost)
 *   low. Farmers further away are put on standby rather than dropped.
 *
 * Step 3 — FAIR ALLOCATION (allocate)
 *   "equal"        max-min fairness ("water-filling"): split the order
 *                  equally; anyone whose whole lot is smaller than their
 *                  equal share sells everything, and the leftover is
 *                  re-shared among the rest. Small farmers are never
 *                  squeezed out by large ones.
 *   "proportional" each farmer sells in proportion to their stock.
 *   Quantities are rounded to 0.1 kg and the rounding drift is corrected
 *   so the totals add up exactly.
 *
 * Assumptions: one flat price per kg for the whole pool (the buyer's offer),
 * straight-line rather than road distance, and no transport-cost model.
 */

export const EPS = 0.05; // kg — anything below this is treated as zero

const round1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0088;
  const rad = (d) => (d * Math.PI) / 180;
  const p1 = rad(lat1);
  const p2 = rad(lat2);
  const dphi = p2 - p1;
  const dlmb = rad(lon2 - lon1);
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dlmb / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Split the listings for the request's crop into { eligible, excluded }.
 * eligible: [{ listing, distanceKm }]
 * excluded: [{ listingId, farmerName, village, distanceKm, remainingKg,
 *              reason, reasonCode, reasonParams }]
 */
export function evaluateListings(request, listings, coordsOf, radiusKm) {
  const [reqLat, reqLng] = coordsOf(request.location);
  const eligible = [];
  const excluded = [];

  for (const listing of listings) {
    if (listing.crop !== request.crop) continue;
    if (listing.status !== "open" || listing.remainingKg <= EPS) continue;

    const [lat, lng] = coordsOf(listing.location);
    const distance = haversineKm(reqLat, reqLng, lat, lng);

    let reason = null;
    let code = null;
    let params = {};
    if (listing.minPricePerKg > request.offerPricePerKg + 1e-9) {
      code = "price";
      params = { min: listing.minPricePerKg, offer: request.offerPricePerKg };
      reason = `Minimum price ₹${listing.minPricePerKg} is above the offered ₹${request.offerPricePerKg}`;
    } else if (listing.availableFrom > request.neededBy) {
      code = "date";
      params = { date: listing.availableFrom };
      reason = `Available from ${listing.availableFrom}, after the needed-by date`;
    } else if (distance > radiusKm) {
      code = "radius";
      params = { km: Math.round(distance), radius: radiusKm };
      reason = `${Math.round(distance)} km away, outside the ${radiusKm} km radius`;
    }

    if (reason) {
      // `reason` is an English sentence for API consumers; the frontend uses
      // reasonCode + reasonParams to phrase it in the user's language.
      excluded.push({
        listingId: listing.id,
        farmerName: listing.farmerName,
        village: listing.location,
        distanceKm: round1(distance),
        remainingKg: listing.remainingKg,
        reason,
        reasonCode: code,
        reasonParams: params,
      });
    } else {
      eligible.push({ listing, distanceKm: distance });
    }
  }
  return { eligible, excluded };
}

/** Nearest-first until stock covers demand. Returns { selected, standby }. */
export function selectPool(eligible, demandKg) {
  const ordered = [...eligible].sort(
    (a, b) => a.distanceKm - b.distanceKm || b.listing.remainingKg - a.listing.remainingKg,
  );
  const selected = [];
  const standby = [];
  let total = 0;
  for (const entry of ordered) {
    if (total >= demandKg - EPS) {
      standby.push(entry);
    } else {
      selected.push(entry);
      total += entry.listing.remainingKg;
    }
  }
  return { selected, standby };
}

/**
 * Split demandKg across farmers whose stock limits are `caps`.
 * Returns quantities aligned with `caps`. The total is min(demand, sum(caps))
 * and no farmer is given more than their cap.
 */
export function allocate(demandKg, caps, mode = "equal") {
  const n = caps.length;
  if (n === 0 || demandKg <= 0) return new Array(n).fill(0);
  const totalCap = caps.reduce((s, c) => s + c, 0);
  const target = Math.min(demandKg, totalCap);

  let raw;
  if (mode === "proportional") {
    raw = caps.map((c) => (target * c) / totalCap);
  } else if (mode === "equal") {
    raw = new Array(n).fill(0);
    let active = caps.map((_, i) => i).filter((i) => caps[i] > 0);
    let remaining = target;
    while (remaining > 1e-9 && active.length) {
      const share = remaining / active.length;
      const stillActive = [];
      for (const i of active) {
        const give = Math.min(share, caps[i] - raw[i]);
        raw[i] += give;
        remaining -= give;
        if (caps[i] - raw[i] > 1e-9) stillActive.push(i);
      }
      active = stillActive;
    }
  } else {
    throw new Error(`Unknown fairness mode: ${mode}`);
  }
  return roundToTarget(raw, caps, target);
}

/** Round to 0.1 kg, then push leftover rounding drift onto the farmers with
 *  the most room (or the largest share) so the totals match exactly. */
function roundToTarget(raw, caps, target) {
  const values = raw.map((x, i) => Math.min(round1(x), caps[i]));
  let diff = round1(round1(target) - values.reduce((s, v) => s + v, 0));
  if (Math.abs(diff) < EPS) return values;

  const adding = diff > 0;
  const order = values
    .map((_, i) => i)
    .sort((a, b) => (adding ? caps[b] - values[b] - (caps[a] - values[a]) : values[b] - values[a]));
  for (const i of order) {
    const room = adding ? caps[i] - values[i] : values[i];
    const step = Math.min(Math.abs(diff), room);
    if (step >= EPS) {
      const change = adding ? step : -step;
      values[i] = round1(values[i] + change);
      diff = round1(diff - change);
    }
    if (Math.abs(diff) < EPS) break;
  }
  return values;
}
