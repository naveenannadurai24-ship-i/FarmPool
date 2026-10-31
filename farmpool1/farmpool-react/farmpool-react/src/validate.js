// Form checks run in the user's language (browsers show their own, often
// English, messages otherwise). Each returns a translation key, or null if fine.
import { isoToday } from "./format.js";

export function validateListing(f) {
  if (!f.crop) return "err.crop";
  if (!(Number(f.quantityKg) >= 1)) return "err.qty";
  if (!(Number(f.minPricePerKg) > 0)) return "err.price";
  if ((f.farmerName || "").trim().length < 2) return "err.name";
  if (!/^[6-9][0-9]{9}$/.test((f.phone || "").trim())) return "err.phone";
  if (!f.availableFrom) return "err.date";
  return null;
}

export function validateRequest(f) {
  if (!f.crop) return "err.crop";
  if (!(Number(f.quantityKg) >= 1)) return "err.qty";
  if (!(Number(f.offerPricePerKg) > 0)) return "err.price";
  if ((f.buyerName || "").trim().length < 2) return "err.name";
  if (!f.neededBy) return "err.date";
  if (f.neededBy < isoToday()) return "err.datePast";
  return null;
}
