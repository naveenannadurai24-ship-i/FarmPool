/**
 * seed.js — fictional demo data, created the first time the app runs.
 * Names and phone numbers are made up. Dates are relative to today so the
 * demo never looks stale. Delete db.json to reset back to this.
 *
 * The data is chosen to show every behaviour of the pooling algorithm:
 *   Tomato  -> covered by four farmers; small lots sell out completely
 *   Onion   -> one far farmer is on standby; one is unavailable in time
 *   Banana  -> not enough supply (shortfall) and one farmer out of range
 *   Brinjal -> a simple two-farmer pool
 *   A Tomato listing priced above the offer -> shows an exclusion reason
 */
import { isoDateInDays, isoDateTime } from "./dates.js";

export function buildSeed() {
  const now = isoDateTime();

  const farmers = [
    // name, phone, crop, kg, min ₹/kg, location, available in N days
    ["Murugan S", "9876500001", "Tomato", 220, 16, "Krishnagiri", 1],
    ["Selvi R", "9876500002", "Tomato", 140, 18, "Hosur", 2],
    ["Karthik P", "9876500003", "Tomato", 90, 15, "Vellore", 1],
    ["Lakshmi V", "9876500004", "Tomato", 60, 17, "Dharmapuri", 3],
    ["Dinesh K", "9876500005", "Tomato", 100, 30, "Krishnagiri", 1],
    ["Arumugam T", "9876500006", "Onion", 300, 22, "Dindigul", 2],
    ["Valli M", "9876500007", "Onion", 180, 20, "Namakkal", 1],
    ["Ravi N", "9876500008", "Onion", 120, 21, "Karur", 4],
    ["Bala E", "9876500016", "Onion", 150, 20, "Dindigul", 20],
    ["Meena A", "9876500009", "Banana", 250, 28, "Tiruchirappalli", 2],
    ["Senthil G", "9876500010", "Banana", 150, 30, "Thanjavur", 3],
    ["Kavitha B", "9876500011", "Banana", 90, 26, "Kumbakonam", 2],
    ["Palani C", "9876500012", "Brinjal", 110, 14, "Salem", 1],
    ["Ganesh D", "9876500013", "Brinjal", 80, 13, "Erode", 2],
    ["Revathi L", "9876500014", "Carrot", 200, 32, "Ooty", 1],
    ["Anbu J", "9876500015", "Potato", 260, 20, "Ooty", 2],
  ];
  const listings = farmers.map(([farmerName, phone, crop, kg, price, location, avail], i) => ({
    id: `lst_seed${String(i + 1).padStart(2, "0")}`,
    farmerName,
    phone,
    crop,
    quantityKg: kg,
    remainingKg: kg,
    minPricePerKg: price,
    location,
    availableFrom: isoDateInDays(avail),
    status: "open",
    createdAt: now,
  }));

  const buyers = [
    // name, type, crop, kg, offer ₹/kg, location, radius km, needed in N days
    ["Annapurna Hostel Mess", "Hostel / mess", "Tomato", 450, 22, "Chennai", 300, 7],
    ["Kovai Biryani House", "Restaurant", "Onion", 400, 26, "Coimbatore", 200, 10],
    ["Sri Balaji Canteen", "Canteen", "Banana", 500, 32, "Madurai", 150, 8],
    ["Green Basket Store", "Retail store", "Brinjal", 150, 18, "Salem", 100, 6],
  ];
  const requests = buyers.map(([buyerName, buyerType, crop, kg, offer, location, radiusKm, needed], i) => ({
    id: `req_seed${String(i + 1).padStart(2, "0")}`,
    buyerName,
    buyerType,
    crop,
    quantityKg: kg,
    filledKg: 0,
    offerPricePerKg: offer,
    location,
    radiusKm,
    neededBy: isoDateInDays(needed),
    status: "open",
    createdAt: now,
  }));

  return { listings, requests, pools: [] };
}
