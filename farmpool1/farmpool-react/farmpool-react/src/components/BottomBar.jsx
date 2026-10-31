import { useLang } from "../LangContext.jsx";

// Always-visible actions on phones (the header buttons are hidden there).
export default function BottomBar({ onOpenListing, onOpenRequest }) {
  const { t } = useLang();
  return (
    <div className="bottom-bar">
      <button type="button" className="btn btn-leaf" id="barListing" onClick={onOpenListing}>{t("bar.list")}</button>
      <button type="button" className="btn btn-turmeric" id="barRequest" onClick={onOpenRequest}>{t("bar.request")}</button>
    </div>
  );
}
