"use client";

import { useState } from "react";
import { SubscriptionPlan, SubscriptionStatus } from "@shopli/db";
import { PLAN_CONFIG, EffectiveSubscriptionResult } from "@/lib/subscription-plans";
import { Check, ShieldCheck, Sparkles, AlertCircle, CreditCard, ExternalLink, Loader2, ArrowRight } from "lucide-react";

interface BillingClientViewProps {
  empresa: {
    id: string;
    nombre: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: string | null;
  };
  effectiveSub: EffectiveSubscriptionResult;
  usage: {
    products: number;
    branches: number;
    users: number;
  };
  initialSuccess?: boolean;
}

export function BillingClientView({
  empresa,
  effectiveSub,
  usage,
  initialSuccess = false,
}: BillingClientViewProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    initialSuccess ? "¡Suscripción confirmada exitosamente! Tu plan ha sido activado." : null
  );

  // Estado para el modal preventivo de downgrade
  const [downgradeModal, setDowngradeModal] = useState<{
    isOpen: boolean;
    reason: string;
    targetPlanName: string;
  }>({ isOpen: false, reason: "", targetPlanName: "" });

  const hasActiveStripeSub = Boolean(empresa.stripeSubscriptionId);

  const handleSelectPlan = async (planKey: SubscriptionPlan) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Si ya tiene este plan activo
    if (effectiveSub.plan === planKey && hasActiveStripeSub && effectiveSub.effectiveStatus === SubscriptionStatus.ACTIVE) {
      return;
    }

    setLoadingPlan(planKey);

    try {
      if (hasActiveStripeSub) {
        // Actualización en caliente (/api/stripe/update-plan)
        const res = await fetch("/api/stripe/update-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetPlan: planKey, interval }),
        });

        const data = await res.json();

        if (!res.ok) {
          // Si fue bloqueado por recursos excedentes (Downgrade)
          if (data.error && data.error.includes("exced")) {
            setDowngradeModal({
              isOpen: true,
              reason: data.error,
              targetPlanName: PLAN_CONFIG[planKey].name,
            });
          } else {
            setErrorMsg(data.error || "No se pudo actualizar el plan.");
          }
          setLoadingPlan(null);
          return;
        }

        setSuccessMsg(data.message || "Plan actualizado correctamente.");
        window.location.reload();
      } else {
        // Primer checkout (/api/stripe/checkout)
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: planKey, interval }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "No se pudo iniciar el proceso de pago.");
          setLoadingPlan(null);
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (err: any) {
      setErrorMsg("Ocurrió un error de red al procesar tu solicitud.");
      setLoadingPlan(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setPortalLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "No se pudo abrir el portal de facturación.");
        setPortalLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setErrorMsg("Error de conexión al abrir el portal.");
      setPortalLoading(false);
    }
  };

  const plansList = [
    PLAN_CONFIG[SubscriptionPlan.ARRANQUE],
    PLAN_CONFIG[SubscriptionPlan.CRECIMIENTO],
    PLAN_CONFIG[SubscriptionPlan.MULTISUCURSAL],
  ];

  return (
    <div className="space-y-10 pb-16 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Suscripción y Facturación
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1 text-sm">
            Administra el plan de tu empresa, límites de sucursales y comprobantes de pago oficiales.
          </p>
        </div>

        {empresa.stripeCustomerId && (
          <button
            onClick={handleOpenCustomerPortal}
            disabled={portalLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-200 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Administrar Tarjetas y Facturas
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Alertas de Notificación */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-sm font-medium">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Resumen de Estado Actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Plan Activo */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">
            Plan Actual
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {PLAN_CONFIG[effectiveSub.plan].name}
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                effectiveSub.effectiveStatus === SubscriptionStatus.ACTIVE
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : effectiveSub.effectiveStatus === SubscriptionStatus.TRIALING
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
              }`}
            >
              {effectiveSub.effectiveStatus === SubscriptionStatus.ACTIVE
                ? "Activo"
                : effectiveSub.effectiveStatus === SubscriptionStatus.TRIALING
                ? "Periodo de Prueba"
                : effectiveSub.effectiveStatus === SubscriptionStatus.GRACE_PERIOD
                ? "Periodo de Gracia"
                : "Suspendido"}
            </span>
          </div>

          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
            {effectiveSub.effectiveStatus === SubscriptionStatus.TRIALING
              ? `Te quedan ${effectiveSub.daysRemaining ?? 0} días de prueba gratuita con acceso completo.`
              : effectiveSub.effectiveStatus === SubscriptionStatus.GRACE_PERIOD
              ? `Pago pendiente. Tienes ${effectiveSub.graceDaysRemaining ?? 0} días de gracia para regularizar.`
              : empresa.currentPeriodEnd
              ? `Próxima renovación: ${new Date(empresa.currentPeriodEnd).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}`
              : "Suscripción activa."}
          </p>
        </div>

        {/* Card 2: Uso de Recursos */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">
            Uso de tu Catálogo
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {usage.products}
            <span className="text-base font-medium text-gray-400">
              {PLAN_CONFIG[effectiveSub.plan].maxProducts === Infinity
                ? " / Ilimitados"
                : ` / ${PLAN_CONFIG[effectiveSub.plan].maxProducts} productos`}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
            {PLAN_CONFIG[effectiveSub.plan].maxProducts !== Infinity &&
              usage.products >= 65 && (
                <span className="text-amber-600 font-medium">
                  Próximo al límite de 75 productos.
                </span>
              )}
            {PLAN_CONFIG[effectiveSub.plan].maxProducts === Infinity && "Catálogo sin restricciones."}
          </p>
        </div>

        {/* Card 3: Sucursales y Usuarios */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">
            Sucursales y Personal
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block">Sucursales Activas</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {usage.branches} / {PLAN_CONFIG[effectiveSub.plan].maxBranches}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Usuarios Registrados</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {usage.users} /{" "}
                {PLAN_CONFIG[effectiveSub.plan].maxUsers === Infinity
                  ? "∞"
                  : PLAN_CONFIG[effectiveSub.plan].maxUsers}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-3">
            {PLAN_CONFIG[effectiveSub.plan].hasDynamicAudits
              ? "✅ Auditorías Dinámicas habilitadas"
              : "❌ Auditorías Dinámicas bloqueadas"}
          </p>
        </div>
      </div>

      {/* Selector de Intervalo (Mensual vs Anual con descuento) */}
      <div className="flex flex-col items-center justify-center pt-4">
        <div className="bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-2xl flex items-center gap-1">
          <button
            onClick={() => setInterval("month")}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              interval === "month"
                ? "bg-white dark:bg-black text-black dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Facturación Mensual
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              interval === "year"
                ? "bg-white dark:bg-black text-black dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Facturación Anual
            <span className="bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              2 meses gratis
            </span>
          </button>
        </div>
        <span className="text-xs text-gray-400 mt-2">
          Precios netos en MXN con IVA (16%) incluido. Sin cargos ocultos.
        </span>
      </div>

      {/* Grid de Tarjetas de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-2">
        {plansList.map((plan) => {
          const isCurrentPlan = effectiveSub.plan === plan.id;
          const priceObj = interval === "year" ? plan.prices.yearly : plan.prices.monthly;
          const displayPrice =
            interval === "year"
              ? Math.round(priceObj.amount / 12)
              : priceObj.amount;

          const isFeatured = plan.id === SubscriptionPlan.CRECIMIENTO;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                isFeatured
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-xl ring-2 ring-black dark:ring-white md:-translate-y-2"
                  : "bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-white shadow-sm hover:shadow-md"
              }`}
            >
              {plan.badge && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                    isFeatured
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black"
                      : "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p
                      className={`text-xs mt-1 ${
                        isFeatured ? "text-gray-300 dark:text-zinc-600" : "text-gray-500 dark:text-zinc-400"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${displayPrice}
                    </span>
                    <span
                      className={`text-xs ${
                        isFeatured ? "text-gray-300 dark:text-zinc-600" : "text-gray-500 dark:text-zinc-400"
                      }`}
                    >
                      MXN / mes
                    </span>
                  </div>
                  {interval === "year" && (
                    <span
                      className={`text-xs block mt-1 ${
                        isFeatured ? "text-gray-300 dark:text-zinc-600" : "text-emerald-600 font-medium"
                      }`}
                    >
                      Facturado anualmente: ${priceObj.amount} MXN (Ahorras 2 meses)
                    </span>
                  )}
                </div>

                {/* Lista de Prestaciones */}
                <div
                  className={`border-t pt-6 space-y-3.5 text-sm ${
                    isFeatured
                      ? "border-gray-800 dark:border-zinc-200"
                      : "border-gray-100 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Check
                      className={`w-4 h-4 shrink-0 ${
                        isFeatured ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    />
                    <span>
                      {plan.maxBranches === 1 ? "1 Sucursal incluida" : `Hasta ${plan.maxBranches} Sucursales`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Check
                      className={`w-4 h-4 shrink-0 ${
                        isFeatured ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    />
                    <span className="font-medium">
                      {plan.maxProducts === Infinity
                        ? "Catálogo de Productos ILIMITADO"
                        : `Hasta ${plan.maxProducts} productos en catálogo`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Check
                      className={`w-4 h-4 shrink-0 ${
                        isFeatured ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    />
                    <span>
                      {plan.maxUsers === Infinity
                        ? "Usuarios y Cajeros ILIMITADOS"
                        : `Hasta ${plan.maxUsers} usuarios con PIN rápido`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Check
                      className={`w-4 h-4 shrink-0 ${
                        isFeatured ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    />
                    <span>POS Offline-First para ventas sin internet</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Check
                      className={`w-4 h-4 shrink-0 ${
                        isFeatured ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    />
                    <span>Impresión de etiquetas con código QR (Carta y Térmica)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {plan.hasDynamicAudits ? (
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          isFeatured ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      />
                    ) : (
                      <span className="text-gray-400 font-bold shrink-0 w-4 text-center">✕</span>
                    )}
                    <span className={!plan.hasDynamicAudits ? "text-gray-400 line-through" : ""}>
                      Auditorías Dinámicas (Control de mermas y robos)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {plan.hasAnalytics ? (
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          isFeatured ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      />
                    ) : (
                      <span className="text-gray-400 font-bold shrink-0 w-4 text-center">✕</span>
                    )}
                    <span className={!plan.hasAnalytics ? "text-gray-400 line-through" : ""}>
                      Módulo de Analytics, márgenes y ventas históricas
                    </span>
                  </div>

                  {plan.hasTransfers && (
                    <div className="flex items-center gap-3">
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          isFeatured ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      />
                      <span>Transferencias de stock entre sucursales</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de Acción */}
              <div className="mt-8 pt-4">
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan !== null || (isCurrentPlan && hasActiveStripeSub)}
                  className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrentPlan && hasActiveStripeSub
                      ? "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700"
                      : isFeatured
                      ? "bg-white text-black hover:bg-gray-100 dark:bg-black dark:text-white dark:hover:bg-zinc-900 shadow-md"
                      : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentPlan && hasActiveStripeSub ? (
                    "Tu Plan Actual"
                  ) : hasActiveStripeSub ? (
                    <>
                      Cambiar a este Plan
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    "Contratar este Plan"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Preventivo de Downgrade con Recursos Excedentes */}
      {downgradeModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-2xl p-6 border border-gray-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                No es posible cambiar al {downgradeModal.targetPlanName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mt-2">
                {downgradeModal.reason}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setDowngradeModal({ isOpen: false, reason: "", targetPlanName: "" })}
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
