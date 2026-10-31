import { useState } from "react";
import { postJSON } from "../api.js";
import { useAppData } from "../AppData.jsx";
import { useLang } from "../LangContext.jsx";
import { useToast } from "../Toast.jsx";
import { dateInDays } from "../format.js";
import { go } from "../router.js";
import { validateRequest } from "../validate.js";
import CropGrid from "./CropGrid.jsx";
import Modal from "./Modal.jsx";
import QuantityField from "./QuantityField.jsx";

const RADII = [50, 100, 150, 200, 300, 500];

// Buyer: post a request. On success we jump straight to its pool preview.
export default function RequestDialog({ open, onClose }) {
  const { t, lang, townName, buyerTypeName } = useLang();
  const { meta, bump } = useAppData();
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    crop: "", quantityKg: "", offerPricePerKg: "", location: "", radiusKm: "150",
    buyerName: "", buyerType: "", neededBy: dateInDays(7),
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (name) => (value) => setForm((f) => ({ ...f, [name]: value }));
  const onInput = (name) => (e) => set(name)(e.target.value);
  const location = form.location || meta?.locations[0]?.name || "";
  const buyerType = form.buyerType || meta?.buyerTypes[0] || "";

  async function submit(e) {
    e.preventDefault();
    const problem = validateRequest(form);
    if (problem) { setError(t(problem)); return; }
    setError("");
    setBusy(true);
    try {
      const req = await postJSON("/requests", {
        buyerName: form.buyerName.trim(), buyerType, crop: form.crop,
        quantityKg: Number(form.quantityKg), offerPricePerKg: Number(form.offerPricePerKg),
        location, radiusKm: Number(form.radiusKm), neededBy: form.neededBy,
      });
      bump();
      onClose();
      toast(t("toast.requestPosted"));
      go(`/order/${req.id}`);
    } catch (err) {
      setError(lang === "en" && err.message ? err.message : t("err.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal id="dlgRequest" open={open} onClose={onClose} labelledBy="dlgRequestTitle">
      <div className="dlg-body">
        <button type="button" className="dlg-x" aria-label="Close" onClick={onClose}>&times;</button>
        <h2 id="dlgRequestTitle">{t("request.title")}</h2>
        <p className="hint">{t("request.hint")}</p>
        <form id="formRequest" noValidate onSubmit={submit}>
          <div className="fields">
            <div className="field full">
              <span className="field-label">{t("f.crop")}</span>
              <CropGrid id="requestCropGrid" value={form.crop} onChange={set("crop")} />
            </div>
            <QuantityField id="requestQty" label={t("f.qty.request")} value={form.quantityKg} onChange={set("quantityKg")} />
            <label className="field full">
              <span className="field-label">{t("f.price.request")}</span>
              <input name="offerPricePerKg" type="number" inputMode="decimal" min="0.5" step="0.5"
                value={form.offerPricePerKg} onChange={onInput("offerPricePerKg")} />
            </label>
            <label className="field">
              <span className="field-label">{t("f.deliver")}</span>
              <select name="location" id="requestLocation" value={location} onChange={onInput("location")}>
                {meta?.locations.map((l) => <option key={l.name} value={l.name}>{townName(l.name)}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-label">{t("f.radius")}</span>
              <select name="radiusKm" id="requestRadius" value={form.radiusKm} onChange={onInput("radiusKm")}>
                {RADII.map((r) => <option key={r} value={r}>{r} {t("unit.km")}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-label">{t("f.business")}</span>
              <input name="buyerName" type="text" maxLength={60} value={form.buyerName} onChange={onInput("buyerName")} />
            </label>
            <label className="field">
              <span className="field-label">{t("f.btype")}</span>
              <select name="buyerType" id="requestType" value={buyerType} onChange={onInput("buyerType")}>
                {meta?.buyerTypes.map((b) => <option key={b} value={b}>{buyerTypeName(b)}</option>)}
              </select>
            </label>
            <label className="field full">
              <span className="field-label">{t("f.needby")}</span>
              <input name="neededBy" type="date" value={form.neededBy} onChange={onInput("neededBy")} />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dlg-actions">
            <button type="button" className="btn btn-line" onClick={onClose}>{t("btn.cancel")}</button>
            <button type="submit" className="btn btn-turmeric" disabled={busy}>{t("btn.post")}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
