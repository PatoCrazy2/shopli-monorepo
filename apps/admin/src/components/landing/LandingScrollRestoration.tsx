"use client";

import { useEffect } from "react";

export default function LandingScrollRestoration() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Desactivar la restauracion automatica nativa del navegador (especialmente WebKit/Safari)
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Comprobar si se trata de una recarga de pagina o si hay hash presente
    const navEntries = performance.getEntriesByType("navigation");
    const isReload =
      navEntries.length > 0 &&
      (navEntries[0] as PerformanceNavigationTiming).type === "reload";

    if (isReload || window.location.hash) {
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  return null;
}