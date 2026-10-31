// Number, money and date formatting that follows the chosen language.
export function makeFormat(lang, t) {
  const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  const nf2 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
  const locale = lang === "ta" ? "ta-IN" : "en-IN";
  return {
    num: (n) => nf.format(n),
    num2: (n) => nf2.format(n),
    kg: (n) => `${nf.format(n)} ${t("unit.kg")}`,
    inr: (n) => `₹${nf0.format(n)}`,
    inrPerKg: (n) => `₹${nf2.format(n)}/${t("unit.kg")}`,
    shortDate: (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" }),
    shortDateTime: (iso) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
  };
}

const pad = (x) => String(x).padStart(2, "0");

// Local YYYY-MM-DD, n days from today.
export function dateInDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const isoToday = () => dateInDays(0);
