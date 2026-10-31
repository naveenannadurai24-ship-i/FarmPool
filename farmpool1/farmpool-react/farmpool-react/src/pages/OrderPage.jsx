import { useState } from "react";
import { postJSON } from "../api.js";
import { useAppData, useFetch } from "../AppData.jsx";
import { useLang } from "../LangContext.jsx";
import { useToast } from "../Toast.jsx";
import { CROP_EMOJI } from "../i18n.js";
import { go } from "../router.js";
import { speak } from "../speech.js";
import AllocationTable from "../components/AllocationTable.jsx";
import ExcludedList from "../components/ExcludedList.jsx";
import PoolMeter from "../components/PoolMeter.jsx";

const RADII = [50, 100, 150, 200, 300, 500];

// One order: who would be in the pool, how it splits, and a confirm button.
export default function OrderPage({ id }) {
  const { t, lang, fmt, cropName, townName, buyerTypeName } = useLang();
  const { bump } = useAppData();
  const toast = useToast();
  const [fairness, setFairness] = useState("equal");
  const [radius, setRadius] = useState(null); // null = use the order's own radius
  const [confirming, setConfirming] = useState(false);

  const query = new URLSearchParams({ fairness });
  if (radius) query.set("radius_km", radius);
  const { data: pool, error } = useFetch(`/requests/${encodeURIComponent(id)}/pool?${query}`);

  if (error && !pool) return <div className="notice bad">{t("err.load", { msg: error.message })}</div>;
  if (!pool) return <p className="loading">{t("loading")}</p>;

  const req = pool.request;
  const s = pool.summary;
  const radiusValue = radius ?? pool.params.radiusKm;
  const fulfilled = req.status === "fulfilled";
  const radii = RADII.includes(radiusValue) ? RADII : [...RADII, radiusValue].sort((a, b) => a - b);

  // WhatsApp share text and read-aloud summary
  const shareText = t("share.order", {
    buyer: req.buyerName, kg: fmt.kg(req.quantityKg), crop: cropName(req.crop),
    price: fmt.inrPerKg(req.offerPricePerKg), town: townName(req.location),
    date: fmt.shortDate(req.neededBy), url: `${window.location.origin}/#/order/${req.id}`,
  });
  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const listen = () => {
    const text = t("speech.order", {
      buyer: req.buyerName, kg: fmt.num(req.quantityKg), crop: cropName(req.crop),
      price: fmt.num2(req.offerPricePerKg), date: fmt.shortDate(req.neededBy),
      n: s.farmersCount, filled: fmt.num(s.filledKg),
    });
    if (!speak(text, lang)) toast(t("voice.none"));
  };

  async function confirm() {
    setConfirming(true);
    try {
      const result = await postJSON(`/requests/${encodeURIComponent(id)}/confirm`, { radiusKm: radiusValue, fairness });
      toast(t("toast.confirmed", { n: result.summary.farmersCount, kg: fmt.kg(result.summary.filledKg) }));
      bump();
      go("/pools");
    } catch (err) {
      toast(err.status === 409 ? t("err.conflict") : (lang === "en" ? err.message : t("err.generic")));
      setConfirming(false);
    }
  }

  return (
    <>
      <a className="back" href="#/">{t("order.back")}</a>
      <header className="order-head">
        <div>
          <h1>
            {req.buyerName}
            {fulfilled && <span className="badge">{t("order.full")}</span>}
          </h1>
          <span className="sub">
            {t("order.meta", { type: buyerTypeName(req.buyerType), town: townName(req.location), date: fmt.shortDate(req.neededBy) })}
          </span>
        </div>
        <div className="order-ask">
          <strong>{fmt.kg(req.quantityKg)} {CROP_EMOJI[req.crop] || "🌱"} {cropName(req.crop)}</strong>
          <span>{t("order.at", { price: fmt.inrPerKg(req.offerPricePerKg) })}</span>
        </div>
      </header>

      <div className="share-row">
        <button type="button" className="btn btn-line" id="listenBtn" onClick={listen}>🔊 {t("btn.listen")}</button>
        <a className="btn btn-line" href={waHref} target="_blank" rel="noopener noreferrer">{t("btn.whatsapp")}</a>
      </div>

      {fulfilled ? (
        <div className="notice">{t("notice.full")} <a href="#/pools">{t("nav.pools")}</a></div>
      ) : (
        <>
          {req.filledKg > 0 && (
            <div className="notice">{t("notice.earlier", { done: fmt.kg(req.filledKg), rest: fmt.kg(s.demandKg) })}</div>
          )}

          <div className="controls">
            <div className="control">
              <span className="control-label">{t("split.label")}</span>
              <div className="seg-toggle" role="group" aria-label={t("split.label")}>
                <button type="button" data-fair="equal" className={fairness === "equal" ? "on" : ""} onClick={() => setFairness("equal")}>{t("split.equal")}</button>
                <button type="button" data-fair="proportional" className={fairness === "proportional" ? "on" : ""} onClick={() => setFairness("proportional")}>{t("split.stock")}</button>
              </div>
              <p className="hint">{t(`hint.${fairness}`)}</p>
            </div>
            <label className="control">
              <span className="control-label">{t("radius.label")}</span>
              <select id="radiusSel" value={radiusValue} onChange={(e) => setRadius(Number(e.target.value))}>
                {radii.map((r) => <option key={r} value={r}>{r} {t("unit.km")}</option>)}
              </select>
            </label>
          </div>

          <section className="pool">
            <PoolMeter pool={pool} />
            {s.farmersCount === 0 ? (
              <p className="pool-caption warn">{t("caption.none", { km: radiusValue })}</p>
            ) : (
              <p className="pool-caption">
                {t("caption.ok", {
                  filled: fmt.kg(s.filledKg), demand: fmt.kg(s.demandKg), n: s.farmersCount,
                  km: fmt.num(s.avgDistanceKm), value: fmt.inr(s.totalValue),
                })}
                {s.shortfallKg > 0.05 && <span className="warn"> {t("caption.short", { kg: fmt.kg(s.shortfallKg) })}</span>}
              </p>
            )}
          </section>

          {s.farmersCount > 0 && <AllocationTable pool={pool} />}
          <ExcludedList items={pool.excluded} />

          <div className="confirm-bar">
            <button type="button" className="btn btn-turmeric btn-big" id="confirmBtn" disabled={!s.farmersCount || confirming} onClick={confirm}>
              {t("btn.confirm")}
            </button>
            <p className="hint">{t("confirm.note")}</p>
          </div>
        </>
      )}
    </>
  );
}
