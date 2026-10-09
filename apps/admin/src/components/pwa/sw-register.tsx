"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      let registrationRef: ServiceWorkerRegistration | null = null;

      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/", updateViaCache: "none" })
          .then((registration) => {
            registrationRef = registration;
            console.log("ShopLI PWA Service Worker registrado con éxito:", registration.scope);
          })
          .catch((error) => {
            console.error("Error al registrar el Service Worker de ShopLI:", error);
          });
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && registrationRef) {
          registrationRef.update().catch(() => {});
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener("load", registerSW);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, []);

  return null;
}
