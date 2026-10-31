import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const AppDataContext = createContext(null);

// Loads the crop/town lists once, and keeps a "version" counter. Anything that
// changes data calls bump(), and every useFetch() on screen reloads.
export function AppDataProvider({ children }) {
  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState(null);
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    api("/meta").then(setMeta).catch(setMetaError);
  }, []);

  return (
    <AppDataContext.Provider value={{ meta, metaError, version, bump }}>
      {children}
    </AppDataContext.Provider>
  );
}

export const useAppData = () => useContext(AppDataContext);

// GET `path` and keep the result. While a refresh is running the previous
// data stays on screen, so the page doesn't flash empty when you change a filter.
export function useFetch(path) {
  const { version } = useAppData();
  const [state, setState] = useState({ data: null, error: null });

  useEffect(() => {
    let alive = true;
    api(path)
      .then((data) => { if (alive) setState({ data, error: null }); })
      .catch((error) => { if (alive) setState((s) => ({ ...s, error })); });
    return () => { alive = false; };
  }, [path, version]);

  return state;
}
