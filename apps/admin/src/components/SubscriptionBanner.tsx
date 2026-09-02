"use client";

import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { SubscriptionStatus } from "@shopli/db";
import { EffectiveSubscriptionResult } from "@/lib/subscription-plans";

interface SubscriptionBannerProps {
  effectiveSub: EffectiveSubscriptionResult | null;
  userRole?: string;
}

export function SubscriptionBanner({ effectiveSub, userRole }: SubscriptionBannerProps) {
  if (!effectiveSub || userRole !== "DUENO") {
    return null;
  }

  // Banner para días finales del Free Trial (3 días o menos)
  if (effectiveSub.effectiveStatus === SubscriptionStatus.TRIALING && effectiveSub.isExpiringSoon) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-sm animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Tu prueba gratuita termina pronto:</strong> Te quedan{" "}
            <strong>{effectiveSub.daysRemaining ?? 1} día(s)</strong> de acceso completo. Elige tu
            plan para mantener tu catálogo y auditorías activos.
          </span>
        </div>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
        >
          Elegir Plan
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Banner para Periodo de Gracia (cobro fallido o trial vencido)
  if (effectiveSub.effectiveStatus === SubscriptionStatus.GRACE_PERIOD) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-sm animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>
            <strong>Periodo de Gracia Activo:</strong> Tienes{" "}
            <strong>{effectiveSub.graceDaysRemaining ?? 1} día(s)</strong> de gracia para
            regularizar tu método de pago antes de que se pause la sincronización del punto de venta.
          </span>
        </div>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
        >
          Actualizar Pago
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return null;
}
