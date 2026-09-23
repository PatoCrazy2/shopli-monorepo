"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("ShopLI PWA Service Worker registrado con éxito:", registration.scope);
          })
          .catch((error) => {
            console.error("Error al registrar el Service Worker de ShopLI:", error);
          });
      });
    }
  }, []);

  return null;
}
