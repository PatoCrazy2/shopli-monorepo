"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

type ConnectionStatus = "online" | "offline" | "restored";

export function NetworkBanner() {
  const [status, setStatus] = useState<ConnectionStatus>("online");

  useEffect(() => {
    // Si al montar en cliente ya está sin conexión
    if (typeof window !== "undefined" && !navigator.onLine) {
      setStatus("offline");
    }

    let restoreTimeout: NodeJS.Timeout | null = null;

    const handleOnline = () => {
      setStatus("restored");
      if (restoreTimeout) clearTimeout(restoreTimeout);
      restoreTimeout = setTimeout(() => {
        setStatus("online");
      }, 3000);
    };

    const handleOffline = () => {
      if (restoreTimeout) clearTimeout(restoreTimeout);
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (restoreTimeout) clearTimeout(restoreTimeout);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // En operación normal con internet, no renderiza nada en el DOM
  if (status === "online") {
    return null;
  }

  const isOffline = status === "offline";

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-zinc-950 text-zinc-100 border-b border-zinc-800 shadow-md animate-in slide-in-from-top-2 duration-200 select-none"
    >
      {isOffline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
          <span>Sin conexión a internet. Modo solo lectura.</span>
        </>
      ) : (
        <>
          <Wifi className="w-3.5 h-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
          <span>Conexión restablecida.</span>
        </>
      )}
    </aside>
  );
}
