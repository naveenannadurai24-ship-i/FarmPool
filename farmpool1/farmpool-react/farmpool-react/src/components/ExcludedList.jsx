import { useLang } from "../LangContext.jsx";

// The server sends a reason CODE plus numbers; we phrase it in the user's language.
function useReasonText() {
  const { t, fmt } = useLang();
  return (e) => {
    const p = e.reasonParams || {};
    switch (e.reasonCode) {
      case "price": return t("reason.price", { min: fmt.num2(p.min), offer: fmt.num2(p.offer) });
      case "date": return t("reason.date", { date: fmt.shortDate(p.date) });
      case "radius": return t("reason.radius", { km: p.km, radius: p.radius });
      case "standby": return t("reason.standby");
      default: return e.reason || "";
    }
  };
}

export default function ExcludedList({ items }) {
  const { t, fmt, townName } = useLang();
  const reasonText = useReasonText();
  if (!items.length) return null;
  return (
    <details className="more">
      <summary>{t("excl.title", { n: items.length })}</summary>
      <ul>
        {items.map((e) => (
          <li key={e.listingId}>
            <strong>{e.farmerName}</strong>, {townName(e.village)} ({fmt.kg(e.remainingKg)})
            <span>{reasonText(e)}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
