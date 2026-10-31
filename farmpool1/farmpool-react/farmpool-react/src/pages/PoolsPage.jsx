import { useFetch } from "../AppData.jsx";
import { useLang } from "../LangContext.jsx";
import { CROP_EMOJI } from "../i18n.js";

// Confirmed pools, with tap-to-call and WhatsApp links for each farmer.
function PoolCard({ p }) {
  const { t, fmt, cropName, townName } = useLang();
  const mode = p.fairness === "equal" ? t("split.equal") : t("split.stock");
  return (
    <details className="pool-card">
      <summary>
        <span>
          <strong>{p.buyerName}</strong>
          <span className="sub">{CROP_EMOJI[p.crop] || "🌱"} {cropName(p.crop)}, {townName(p.deliveryLocation)}</span>
        </span>
        <span>
          <strong>{fmt.kg(p.summary.filledKg)}</strong>
          <span className="sub">{t("tf.farmers", { n: p.summary.farmersCount })}</span>
        </span>
        <span>
          <strong>{fmt.inr(p.summary.totalValue)}</strong>
          <span className="sub">{fmt.shortDateTime(p.createdAt)}</span>
        </span>
      </summary>
      <div className="inner">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>{t("th.farmer")}</th><th>{t("th.phone")}</th><th className="num">{t("th.supplies")}</th><th className="num">{t("th.payout")}</th></tr>
            </thead>
            <tbody>
              {p.allocations.map((a) => (
                <tr key={a.listingId}>
                  <td>{a.farmerName}<span className="sub">{townName(a.village)}</span></td>
                  <td>
                    {a.phone}
                    <span className="contact-links">
                      <a href={`tel:+91${a.phone}`}>{t("btn.call")}</a>
                      <a href={`https://wa.me/91${a.phone}`} target="_blank" rel="noopener noreferrer">{t("btn.wa")}</a>
                    </span>
                  </td>
                  <td className="num">{fmt.kg(a.qtyKg)}</td>
                  <td className="num">{fmt.inr(a.payout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">
          {t("pools.detail", { mode, radius: p.radiusKm, price: fmt.inrPerKg(p.offerPricePerKg), date: fmt.shortDate(p.neededBy) })}
        </p>
      </div>
    </details>
  );
}

export default function PoolsPage() {
  const { t } = useLang();
  const { data: pools, error } = useFetch("/pools");
  return (
    <>
      <h2 className="section-title page-title">{t("pools.title")}</h2>
      <p className="hint" style={{ marginBottom: 16 }}>{t("pools.hint")}</p>
      {error && !pools && <div className="notice bad">{t("err.load", { msg: error.message })}</div>}
      {!error && !pools && <p className="loading">{t("loading")}</p>}
      {pools && (pools.length
        ? <div>{pools.map((p) => <PoolCard key={p.id} p={p} />)}</div>
        : <div className="ledger"><div className="empty">{t("pools.empty")}</div></div>)}
    </>
  );
}
