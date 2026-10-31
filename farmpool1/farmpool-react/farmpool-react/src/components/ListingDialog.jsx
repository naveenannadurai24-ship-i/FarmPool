import { useState } from "react";
import { api, postJSON } from "../api.js";
import { useAppData } from "../AppData.jsx";
import { useLang } from "../LangContext.jsx";
import { useToast } from "../Toast.jsx";
import { CROP_EMOJI } from "../i18n.js";
import { dateInDays } from "../format.js";
import { speak } from "../speech.js";
import { validateListing } from "../validate.js";
import CropGrid from "./CropGrid.jsx";
import Modal from "./Modal.jsx";
import QuantityField from "./QuantityField.jsx";

// Farmer: list a harvest. After saving, shows which open orders could use it.
export default function ListingDialog({ open, onClose }) {
  const { t, lang, townName } = useLang();
  const { meta, bump } = useAppData();
  const [form, setForm] = useState(() => ({
    crop: "", quantityKg: "", minPricePerKg: "", location: "",
    farmerName: "", phone: "", availableFrom: dateInDays(1),
  }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { listing, matches }

  const set = (name) => (value) => setForm((f) => ({ ...f, [name]: value }));
  const onInput = (name) => (e) => set(name)(e.target.value);
  const location = form.location || meta?.locations[0]?.name || "";

  async function submit(e) {
    e.preventDefault();
    const problem = validateListing(form);
    if (problem) { setError(t(problem)); return; }
    setError("");
    setBusy(true);
    try {
      const listing = await postJSON("/listings", {
        farmerName: form.farmerName.trim(), phone: form.phone.trim(), crop: form.crop,
        quantityKg: Number(form.quantityKg), minPricePerKg: Number(form.minPricePerKg),
        location, availableFrom: form.availableFrom,
      });
      const matches = await api(`/listings/${encodeURIComponent(listing.id)}/matches`);
      setDone({ listing, matches });
      bump(); // refresh whatever list is on screen behind the dialog
    } catch (err) {
      setError(lang === "en" && err.message ? err.message : t("err.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal id="dlgListing" open={open} onClose={onClose} labelledBy="dlgListingTitle">
      <div className="dlg-body">
        <button type="button" className="dlg-x" aria-label="Close" onClick={onClose}>&times;</button>

        {done ? (
          <ListingDone listing={done.listing} matches={done.matches} onClose={onClose} />
        ) : (
          <div id="listingFormWrap">
            <h2 id="dlgListingTitle">{t("listing.title")}</h2>
            <p className="hint">{t("listing.hint")}</p>
            <form id="formListing" noValidate onSubmit={submit}>
              <div className="fields">
                <div className="field full">
                  <span className="field-label">{t("f.crop")}</span>
                  <CropGrid id="listingCropGrid" value={form.crop} onChange={set("crop")} />
                </div>
                <QuantityField id="listingQty" label={t("f.qty.listing")} value={form.quantityKg} onChange={set("quantityKg")} />
                <label className="field full">
                  <span className="field-label">{t("f.price.listing")}</span>
                  <input name="minPricePerKg" type="number" inputMode="decimal" min="0.5" step="0.5"
                    value={form.minPricePerKg} onChange={onInput("minPricePerKg")} />
                </label>
                <label className="field full">
                  <span className="field-label">{t("f.town")}</span>
                  <select name="location" id="listingLocation" value={location} onChange={onInput("location")}>
                    {meta?.locations.map((l) => <option key={l.name} value={l.name}>{townName(l.name)}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">{t("f.name")}</span>
                  <input name="farmerName" type="text" maxLength={60} autoComplete="name"
                    value={form.farmerName} onChange={onInput("farmerName")} />
                </label>
                <label className="field">
                  <span className="field-label">{t("f.phone")}</span>
                  <input name="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel"
                    placeholder={t("f.phone.ph")} value={form.phone} onChange={onInput("phone")} />
                </label>
                <label className="field full">
                  <span className="field-label">{t("f.ready")}</span>
                  <input name="availableFrom" type="date" value={form.availableFrom} onChange={onInput("availableFrom")} />
                </label>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="dlg-actions">
                <button type="button" className="btn btn-line" onClick={onClose}>{t("btn.cancel")}</button>
                <button type="submit" className="btn btn-leaf" disabled={busy}>{t("btn.add")}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ListingDone({ listing, matches, onClose }) {
  const { t, lang, fmt, cropName, townName } = useLang();
  const toast = useToast();

  const listen = () => {
    const ok = speak(t("speech.listed", { kg: fmt.num(listing.quantityKg), crop: cropName(listing.crop), n: matches.length }), lang);
    if (!ok) toast(t("voice.none"));
  };

  return (
    <div id="listingDone">
      <div className="done-mark" aria-hidden="true">✓</div>
      <h2 id="dlgListingTitle">{t("done.title")}</h2>
      <p className="done-sum">
        {CROP_EMOJI[listing.crop] || "🌱"} {cropName(listing.crop)}, {fmt.kg(listing.quantityKg)}, {townName(listing.location)}
      </p>
      <p className="hint">{matches.length ? t("done.matches", { crop: cropName(listing.crop) }) : t("done.none")}</p>
      {matches.length > 0 && (
        <ul className="match-list">
          {matches.map((m) => (
            <li key={m.requestId}>
              <div>
                <strong>{m.buyerName}</strong>
                <span>{t("done.match", { kg: fmt.kg(m.remainingKg), price: fmt.inrPerKg(m.offerPricePerKg), km: fmt.num(m.distanceKm) })}</span>
              </div>
              <a className="btn btn-line" href={`#/order/${m.requestId}`} onClick={onClose}>{t("btn.viewOrder")}</a>
            </li>
          ))}
        </ul>
      )}
      <div className="dlg-actions">
        <button type="button" className="btn btn-line" id="listenListed" onClick={listen}>🔊 {t("btn.listen")}</button>
        <button type="button" className="btn btn-leaf" onClick={onClose}>{t("btn.done")}</button>
      </div>
    </div>
  );
}
