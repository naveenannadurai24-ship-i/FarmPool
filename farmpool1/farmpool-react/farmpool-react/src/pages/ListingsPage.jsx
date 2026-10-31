import { useState } from "react";
import { useAppData, useFetch } from "../AppData.jsx";
import { useLang } from "../LangContext.jsx";
import { CROP_EMOJI } from "../i18n.js";

export default function ListingsPage() {
  const { t, fmt, cropName, townName } = useLang();
  const { meta } = useAppData();
  const [crop, setCrop] = useState("");
  const { data: listings, error } = useFetch(`/listings${crop ? `?crop=${encodeURIComponent(crop)}` : ""}`);

  return (
    <>
      <h2 className="section-title page-title">{t("listings.title")}</h2>
      <p className="hint" style={{ marginBottom: 16 }}>{t("listings.hint")}</p>
      <label className="filter">
        {t("listings.crop")}
        <select id="cropFilter" value={crop} onChange={(e) => setCrop(e.target.value)}>
          <option value="">{t("listings.all")}</option>
          {meta?.crops.map((c) => <option key={c} value={c}>{CROP_EMOJI[c] || "🌱"} {cropName(c)}</option>)}
        </select>
      </label>

      {error && !listings && <div className="notice bad">{t("err.load", { msg: error.message })}</div>}
      {!error && !listings && <p className="loading">{t("loading")}</p>}
      {listings && (
        <div className="ledger">
          {listings.length === 0 && (
            <div className="empty">{crop ? t("listings.emptyCrop", { crop: cropName(crop) }) : t("listings.empty")}</div>
          )}
          {listings.map((l) => (
            <div className="row" key={l.id}>
              <div className="cell"><strong>{l.farmerName}</strong><span className="sub">{l.phoneMasked}</span></div>
              <div className="cell">
                <strong>{CROP_EMOJI[l.crop] || "🌱"} {cropName(l.crop)}</strong>
                <span className="sub">{t("listings.left", { kg: fmt.kg(l.remainingKg) })}</span>
              </div>
              <div className="cell">
                <strong>{t("listings.from", { price: fmt.inrPerKg(l.minPricePerKg) })}</strong>
                <span className="sub">{t("listings.lowest")}</span>
              </div>
              <div className="cell">
                <strong>{townName(l.location)}</strong>
                <span className="sub">{t("listings.ready", { date: fmt.shortDate(l.availableFrom) })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
