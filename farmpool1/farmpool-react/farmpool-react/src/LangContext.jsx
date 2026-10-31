import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BUYER_TYPE_NAMES, CROP_NAMES, TOWN_NAMES, initialLang, translate } from "./i18n.js";
import { makeFormat } from "./format.js";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const value = useMemo(() => {
    const t = (key, params) => translate(lang, key, params);
    return {
      lang,
      // Only remember the choice once the user actually makes one.
      setLang: (next) => {
        setLangState(next);
        try { localStorage.setItem("hp_lang", next); } catch { /* storage blocked */ }
      },
      t,
      fmt: makeFormat(lang, t),
      cropName: (c) => CROP_NAMES[c]?.[lang] ?? c,
      townName: (n) => (lang === "ta" && TOWN_NAMES[n]) || n,
      buyerTypeName: (b) => BUYER_TYPE_NAMES[b]?.[lang] ?? b,
    };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
