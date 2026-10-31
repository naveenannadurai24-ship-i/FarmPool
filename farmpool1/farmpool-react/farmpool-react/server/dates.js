// Local-time ISO dates (YYYY-MM-DD). toISOString() would use UTC and can be a
// day off around midnight in India (UTC+5:30), so build the string by hand.
const pad = (n) => String(n).padStart(2, "0");

export function isoDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isoDateInDays(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return isoDate(d);
}

// True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-31).
export function isValidIsoDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// Local date + time without a timezone suffix, e.g. 2026-10-14T09:30:05.
// The browser reads this as local time, which is what we want to display.
export function isoDateTime(d = new Date()) {
  return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
