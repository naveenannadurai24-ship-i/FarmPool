// A tiny hash router: #/  #/order/:id  #/listings  #/pools
import { useEffect, useState } from "react";

const currentPath = () => window.location.hash.replace(/^#/, "") || "/";

export function usePath() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return path;
}

export const go = (path) => { window.location.hash = path; };
