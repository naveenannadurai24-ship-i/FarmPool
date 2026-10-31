import { useLang } from "../LangContext.jsx";

const TABS = [
  ["orders", "/", "nav.orders"],
  ["listings", "/listings", "nav.listings"],
  ["pools", "/pools", "nav.pools"],
];

export default function Header({ path, onOpenListing, onOpenRequest }) {
  const { t, lang, setLang } = useLang();
  const active = path === "/listings" ? "listings" : path === "/pools" ? "pools" : "orders";

  return (
    <header className="top">
      <div className="wrap top-inner">
        <a className="brand" href="#/" aria-label="FarmPool">
          <svg width="32" height="32" viewBox="0 0 30 30" aria-hidden="true">
            <rect width="30" height="30" rx="7" fill="#12503A" />
            <rect x="5" y="12" width="9" height="6" fill="#FFFFFF" />
            <rect x="15" y="12" width="6" height="6" fill="#F0B429" />
            <rect x="22" y="12" width="3" height="6" fill="#6DAE8B" />
          </svg>
          <span>FarmPool</span>
        </a>

        <div className="lang-toggle" role="group" aria-label="Language">
          <button type="button" data-lang="en" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
          <button type="button" data-lang="ta" lang="ta" aria-pressed={lang === "ta"} onClick={() => setLang("ta")}>தமிழ்</button>
        </div>

        <nav className="tabs" aria-label="Sections">
          {TABS.map(([key, to, label]) => (
            <a key={key} href={`#${to}`} data-tab={key} className={active === key ? "active" : ""}>{t(label)}</a>
          ))}
        </nav>

        <div className="actions">
          <button type="button" className="btn btn-leaf" id="openListing" onClick={onOpenListing}>{t("btn.list")}</button>
          <button type="button" className="btn btn-turmeric" id="openRequest" onClick={onOpenRequest}>{t("btn.request")}</button>
        </div>
      </div>
    </header>
  );
}
