"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight, X } from "lucide-react";
import { SubscriptionStatus } from "@shopli/db";
import { EffectiveSubscriptionResult } from "@/lib/subscription-plans";

interface SubscriptionBannerProps {
  effectiveSub: EffectiveSubscriptionResult | null;
  userRole?: string;
}

export function SubscriptionBanner({ effectiveSub, userRole }: SubscriptionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Determinar si aplica mostrar banner y cuál es su clave única
  const isExpiringTrial =
    effectiveSub?.effectiveStatus === SubscriptionStatus.TRIALING && effectiveSub.isExpiringSoon;
  const isGracePeriod = effectiveSub?.effectiveStatus === SubscriptionStatus.GRACE_PERIOD;

  const statusKey = isExpiringTrial
    ? `trial_${effectiveSub?.daysRemaining ?? 1}`
    : isGracePeriod
      ? `grace_${effectiveSub?.graceDaysRemaining ?? 1}`
      : null;

  useEffect(() => {
    if (!statusKey) return;
    try {
      // Fecha en formato local YYYY-MM-DD
      const today = new Date().toISOString().split("T")[0];
      const storageKey = `shopli_sub_banner_dismissed_${statusKey}_${today}`;
      if (localStorage.getItem(storageKey) === "true") {
        setIsDismissed(true);
      }
    } catch {
      // Manejo silencioso en caso de bloqueo de localStorage en navegación privada
    }
  }, [statusKey]);

  const handleDismiss = () => {
    if (!statusKey) return;
    setIsDismissed(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const storageKey = `shopli_sub_banner_dismissed_${statusKey}_${today}`;
      localStorage.setItem(storageKey, "true");
    } catch {
      // Manejo silencioso
    }
  };

  if (!effectiveSub || userRole !== "DUENO" || isDismissed) {
    return null;
  }

  // Banner para días finales del Free Trial (3 días o menos)
  if (isExpiringTrial) {
    return (
      <div className="relative mb-6 p-4 pr-10 sm:pr-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-sm animate-in fade-in duration-300">
        <div className="flex items-start sm:items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-snug">
            <strong>Tu prueba gratuita termina pronto:</strong> Te quedan{" "}
            <strong className="font-mono">{effectiveSub.daysRemaining ?? 1} día(s)</strong> de acceso completo. Elige tu
            plan para mantener tu catálogo y auditorías activos.
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
          >
            Elegir Plan
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Cerrar aviso por hoy"
            className="hidden sm:inline-flex p-1.5 rounded-lg text-amber-700/70 hover:text-amber-900 hover:bg-amber-200/50 dark:text-amber-300/70 dark:hover:text-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Botón de cierre absoluto para móvil en esquina superior derecha */}
        <button
          onClick={handleDismiss}
          aria-label="Cerrar aviso por hoy"
          className="sm:hidden absolute top-3 right-3 p-1 rounded-lg text-amber-700/70 hover:text-amber-900 hover:bg-amber-200/50 dark:text-amber-300/70 dark:hover:text-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Banner para Periodo de Gracia (cobro fallido o trial vencido)
  if (isGracePeriod) {
    return (
      <div className="relative mb-6 p-4 pr-10 sm:pr-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-sm animate-in fade-in duration-300">
        <div className="flex items-start sm:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-snug">
            <strong>Periodo de Gracia Activo:</strong> Tienes{" "}
            <strong className="font-mono">{effectiveSub.graceDaysRemaining ?? 1} día(s)</strong> de gracia para
            regularizar tu método de pago antes de que se pause la sincronización del punto de venta.
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
          >
            Actualizar Pago
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Cerrar aviso por hoy"
            className="hidden sm:inline-flex p-1.5 rounded-lg text-rose-700/70 hover:text-rose-900 hover:bg-rose-200/50 dark:text-rose-300/70 dark:hover:text-rose-100 dark:hover:bg-rose-900/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Botón de cierre absoluto para móvil en esquina superior derecha */}
        <button
          onClick={handleDismiss}
          aria-label="Cerrar aviso por hoy"
          className="sm:hidden absolute top-3 right-3 p-1 rounded-lg text-rose-700/70 hover:text-rose-900 hover:bg-rose-200/50 dark:text-rose-300/70 dark:hover:text-rose-100 dark:hover:bg-rose-900/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
}
