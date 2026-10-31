import { useAppData, useFetch } from "../AppData.jsx";
import { useLang } from "../LangContext.jsx";
import { CROP_EMOJI } from "../i18n.js";

function OrderRow({ o }) {
  const { t, fmt, cropName, townName, buyerTypeName } = useLang();
  const fulfilled = o.status === "fulfilled";
  const coverage = Math.max(0, Math.min(100, o.coveragePct));
  const short = !fulfilled && o.shortfallKg > 0.05;
  const status = fulfilled ? t("order.full") : short ? t("order.short", { kg: fmt.kg(o.shortfallKg) }) : t("order.covered");
  return (
    <a className="row" href={`#/order/${o.id}`}>
      <div className="cell">
        <strong>{o.buyerName}</strong>
        <span className="sub">{buyerTypeName(o.buyerType)}, {townName(o.location)}</span>
      </div>
      <div className="cell">
        <strong>{CROP_EMOJI[o.crop] || "🌱"} {cropName(o.crop)}</strong>
        <span className="sub">
          {fmt.kg(o.quantityKg)}{o.filledKg > 0 ? ` ${t("order.pooledPart", { kg: fmt.kg(o.filledKg) })}` : ""}
        </span>
      </div>
      <div className="cell">
        <strong>{fmt.inrPerKg(o.offerPricePerKg)}</strong>
        <span className="sub">{t("order.needby", { date: fmt.shortDate(o.neededBy) })}</span>
      </div>
      <div className="cell meter-cell">
        <div className="meter-mini"><span style={{ width: `${coverage}%` }} /></div>
        <span className={`sub${short ? " warn" : ""}`}>{status}</span>
      </div>
    </a>
  );
}

export default function OrdersPage({ onOpenListing, onOpenRequest }) {
  const { t, fmt } = useLang();
  const orders = useFetch("/requests");
  const stats = useFetch("/stats");
  const error = orders.error || stats.error;
  if (error && !orders.data) return <div className="notice bad">{t("err.load", { msg: error.message })}</div>;
  if (!orders.data || !stats.data) return <p className="loading">{t("loading")}</p>;
  const s = stats.data;

  return (
    <>
      <section className="intro">
        <h1>{t("home.title")}</h1>
        <p>{t("home.sub")}</p>
      </section>

      <section className="roles">
        <button type="button" className="role role-farmer" id="roleFarmer" onClick={onOpenListing}>
          <span className="role-emo" aria-hidden="true">🧑‍🌾</span>
          <span className="role-text"><strong>{t("role.farmer.title")}</strong><span>{t("role.farmer.sub")}</span></span>
        </button>
        <button type="button" className="role role-buyer" id="roleBuyer" onClick={onOpenRequest}>
          <span className="role-emo" aria-hidden="true">🛒</span>
          <span className="role-text"><strong>{t("role.buyer.title")}</strong><span>{t("role.buyer.sub")}</span></span>
        </button>
      </section>

      <section className="how">
        <h2>{t("how.title")}</h2>
        <ol>
          {[1, 2, 3].map((n) => (
            <li key={n}><span className="n">{n}</span>{t(`how.${n}`)}</li>
          ))}
        </ol>
      </section>

      <p className="statline">
        <span>{t("stat.orders", { n: s.openOrders })}</span>
        <span>{t("stat.supply", { kg: fmt.kg(s.availableKg), n: s.openListings })}</span>
        {s.pooledKg > 0 && <span>{t("stat.pooled", { value: fmt.inr(s.pooledValue) })}</span>}
      </p>

      <h2 className="section-title">{t("orders.title")}</h2>
      <div className="ledger">
        {orders.data.length
          ? orders.data.map((o) => <OrderRow key={o.id} o={o} />)
          : <div className="empty">{t("orders.empty")}</div>}
      </div>
    </>
  );
}
