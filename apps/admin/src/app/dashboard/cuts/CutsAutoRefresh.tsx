"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CutsAutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    // Refresco ligero de los datos del servidor cada X ms
    const interval = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null;
}
