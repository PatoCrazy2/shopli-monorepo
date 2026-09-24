"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import {
  Check,
  Minus,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Percent,
  Clock,
  ArrowRight,
  Store,
  Layers,
  Zap,
  Users,
} from "lucide-react";

type BillingCycle = "monthly" | "yearly";

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  effectiveMonthlyWithYearly: number;
  target: string;
  specs: {
    branches: string;
    products: string;
    users: string;
  };
  features: string[];
  ctaText: string;
  isPopular?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    id: "ARRANQUE",
    name: "Arranque",
    tagline: "El punto de partida esencial para microcomercios y abarrotes que buscan agilidad en mostrador.",
    monthlyPrice: 149,
    yearlyPrice: 1490,
    effectiveMonthlyWithYearly: 124,
    target: "1 tienda o micronegocio",
    specs: {
      branches: "1 Sucursal incluida",
      products: "Hasta 75 productos",
      users: "2 usuarios (Dueño + Cajero)",
    },
    features: [
      "Punto de venta Offline-First (cobro sin internet)",
      "Escáner de código de barras con la cámara del celular",
      "Impresión de tickets y etiquetas con código QR",
      "Registro ágil de gastos y caja chica",
      "Apertura y corte de caja por turno",
    ],
    ctaText: "Iniciar 14 días gratis",
  },
  {
    id: "CRECIMIENTO",
    name: "Crecimiento",
    badge: "Más Popular",
    tagline: "Para negocios activos que necesitan inventario sin límites y blindaje total contra el robo hormiga.",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    effectiveMonthlyWithYearly: 249,
    target: "Negocios en expansión y tiendas consolidadas",
    specs: {
      branches: "1 Sucursal incluida",
      products: "Catálogo ILIMITADO",
      users: "3 usuarios (Dueño + Cajeros/Encargados)",
    },
    features: [
      "Todo lo incluido en el Plan Arranque",
      "Catálogo de productos 100% ILIMITADO",
      "Auditorías ciegas de inventario anti-robo hormiga",
      "Módulo de Analytics, utilidades y márgenes reales",
      "Permisos de Encargado y auditoría de cancelaciones",
    ],
    ctaText: "Comenzar prueba gratis",
    isPopular: true,
  },
  {
    id: "MULTISUCURSAL",
    name: "Multi-Sucursal",
    badge: "Empresarial",
    tagline: "Gestión centralizada para cadenas comerciales que requieren sincronización entre tiendas.",
    monthlyPrice: 599,
    yearlyPrice: 5990,
    effectiveMonthlyWithYearly: 499,
    target: "Cadenas de 2 o 3 tiendas",
    specs: {
      branches: "Hasta 3 Sucursales activas",
      products: "Catálogo ILIMITADO",
      users: "Usuarios y cajeros ILIMITADOS",
    },
    features: [
      "Todo lo incluido en el Plan Crecimiento",
      "Hasta 3 sucursales activas interconectadas",
      "Transferencias de stock entre sucursales con concilio",
      "Personal ilimitado con firmas de auditoría UUID",
      "Dashboard ejecutivo consolidado de toda la cadena",
    ],
    ctaText: "Probar Multi-Sucursal",
  },
];

interface ComparisonCategory {
  name: string;
  rows: {
    feature: string;
    arranque: string | boolean;
    crecimiento: string | boolean;
    multi: string | boolean;
    highlight?: boolean;
  }[];
}

const COMPARISON_DATA: ComparisonCategory[] = [
  {
    name: "Capacidad & Alcance",
    rows: [
      { feature: "Sucursales activas", arranque: "1", crecimiento: "1", multi: "Hasta 3" },
      { feature: "Productos en catálogo", arranque: "Hasta 75", crecimiento: "Ilimitados", multi: "Ilimitados", highlight: true },
      { feature: "Usuarios / Cajeros con PIN", arranque: "2 usuarios", crecimiento: "3 usuarios", multi: "Ilimitados" },
      { feature: "Almacenamiento en la nube", arranque: "Incluido", crecimiento: "Incluido", multi: "Incluido" },
    ],
  },
  {
    name: "Punto de Venta (POS)",
    rows: [
      { feature: "Operación Offline-First (sin red)", arranque: true, crecimiento: true, multi: true },
      { feature: "Escaneo con cámara de celular", arranque: true, crecimiento: true, multi: true },
      { feature: "Generador e impresión de QR", arranque: true, crecimiento: true, multi: true },
      { feature: "Control de gastos de caja chica", arranque: true, crecimiento: true, multi: true },
      { feature: "Apertura y corte de turno a ciegas", arranque: true, crecimiento: true, multi: true },
    ],
  },
  {
    name: "Inventario & Prevención de Robo",
    rows: [
      { feature: "Conciliación a puertas abiertas", arranque: true, crecimiento: true, multi: true },
      { feature: "Auditorías ciegas de 3 productos (anti-robo hormiga)", arranque: false, crecimiento: true, multi: true, highlight: true },
      { feature: "Transferencias de stock entre sucursales", arranque: false, crecimiento: false, multi: true },
      { feature: "Bitácora y logs de auditoría obligatorios", arranque: "Básica", crecimiento: "Avanzada", multi: "Avanzada" },
    ],
  },
  {
    name: "Analítica & Control Financiero",
    rows: [
      { feature: "Cierres de caja históricos", arranque: true, crecimiento: true, multi: true },
      { feature: "Reportes de márgenes brutos y utilidades", arranque: false, crecimiento: true, multi: true, highlight: true },
      { feature: "Productos más vendidos y desgloses", arranque: false, crecimiento: true, multi: true },
      { feature: "Consolidación multi-tienda en vivo", arranque: false, crecimiento: false, multi: true },
    ],
  },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-hardware",
    question: "¿Necesito comprar terminales costosas o computadoras dedicadas?",
    answer: "No. ShopLI POS está desarrollado como una PWA móvil de alto rendimiento: puedes instalarlo y cobrar desde cualquier teléfono celular (Android o iPhone) utilizando su propia cámara como escáner de alta velocidad. Para el panel de administración, puedes usar cualquier computadora, laptop o tablet moderna.",
  },
  {
    id: "faq-trial",
    question: "¿Cómo funciona la prueba gratuita de 14 días?",
    answer: "Dispones de acceso inmediato y 100% completo al plan que selecciones durante 14 días naturales. No te pediremos tarjeta de crédito ni método de pago para registrarte. Al concluir tu periodo de prueba, tú decides si ingresar tus datos de facturación para continuar o pausar tu cuenta sin penalizaciones ni cobros imprevistos.",
  },
  {
    id: "faq-offline",
    question: "¿Qué ocurre si mi sucursal se queda sin señal de internet a mitad de un cobro?",
    answer: "Tu negocio nunca se detiene. Gracias a nuestra arquitectura Offline-First en el cliente POS, tus cajeros pueden continuar registrando ventas, aplicando cobros y emitiendo tickets sin interrupción. En cuanto el dispositivo recupera conexión, la conciliación matemática se sincroniza de fondo con la base de datos central de forma idempotente.",
  },
  {
    id: "faq-cancel",
    question: "¿Puedo cambiar de plan o cancelar mi suscripción cuando lo desee?",
    answer: "Sí, en cualquier momento con un solo clic desde tu panel de Facturación. No tenemos contratos forzosos ni plazos mínimos. Si decides cambiar a un plan superior o inferior, el ajuste se aplica de inmediato prorrateando la diferencia.",
  },
  {
    id: "faq-blind-audits",
    question: "¿Qué son las auditorías ciegas y cómo combaten el robo hormiga?",
    answer: "Al realizar cortes o turnos de caja, el sistema selecciona aleatoriamente 3 productos del inventario y le solicita al cajero ingresar el conteo físico real, sin revelarle la cantidad que el sistema espera. Esto previene que el personal 'cuadre' números a conveniencia y genera un reporte inmediato de mermas para el dueño.",
  },
];

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="precios"
      className="relative z-20 w-full bg-[#050507] text-white pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden select-none"
    >
      {/* Resplandor ambiental de fondo sutil tipo Resend/Luma */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-white/[0.04] to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto">
        {/* ==================== HEADER ==================== */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14 sm:mb-18">
          {/* Badge Monospaced de Sección */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase bg-white/[0.04] border border-white/[0.08] text-neutral-300 backdrop-blur-md mb-5 shadow-sm">
            <Sparkles className="w-3 h-3 text-white/80" />
            <span>Precios & Retorno de Inversión</span>
          </div>

          {/* Titular Principal */}
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
            <span className="bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              Inversión simple. Crecimiento sin ataduras.
            </span>
          </h2>

          {/* Subtítulo Descriptivo */}
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-xl">
            14 días de prueba completa sin tarjeta de crédito. Sin comisiones por venta
            ni equipos costosos: tu celular es tu terminal de cobro.
          </p>

          {/* ==================== TOGGLE DE FACTURACIÓN ==================== */}
          <div className="mt-8 flex items-center justify-center">
            <div className="p-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl flex items-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`relative px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Facturación Mensual
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span>Facturación Anual</span>
                <span
                  className={`text-[10px] font-mono tracking-tight font-semibold px-2 py-0.5 rounded-full transition-colors ${
                    billingCycle === "yearly"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  2 meses gratis
                </span>
              </button>
            </div>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono mt-3">
            Precios en MXN netos (IVA incluido). Cancela en cualquier momento.
          </span>
        </div>

        {/* ==================== TARJETAS BENTO DE PRECIOS ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-6xl mx-auto pt-2">
          {PLANS.map((plan) => {
            const isFeatured = plan.isPopular;
            const price =
              billingCycle === "yearly"
                ? plan.effectiveMonthlyWithYearly
                : plan.monthlyPrice;
            const registerHref = `/register?plan=${plan.id}`;

            return (
              <div
                key={plan.id}
                className={`relative rounded-[28px] flex flex-col justify-between transition-all duration-300 ${
                  isFeatured
                    ? "bg-[#0c0c14]/90 border border-white/25 shadow-[0_0_50px_rgba(255,255,255,0.06),0_20px_40px_rgba(0,0,0,0.8)] lg:-translate-y-3 z-10"
                    : "bg-[#09090e]/70 border border-white/[0.08] hover:border-white/[0.16] shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-0"
                } p-7 sm:p-9 backdrop-blur-2xl`}
              >
                {/* Halo brillante interior para la tarjeta destacada */}
                {isFeatured && (
                  <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/[0.06] via-transparent to-transparent pointer-events-none" />
                )}

                <div>
                  {/* Badge de Plan */}
                  <div className="flex items-center justify-between min-h-[28px] mb-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                      {plan.target}
                    </span>
                    {plan.badge && (
                      <span
                        className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1 ${
                          isFeatured
                            ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            : "bg-white/[0.08] text-neutral-300 border border-white/[0.1]"
                        }`}
                      >
                        {isFeatured && <Sparkles className="w-2.5 h-2.5" />}
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Nombre y Tagline */}
                  <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                    {plan.tagline}
                  </p>

                  {/* Precio */}
                  <div className="pt-2 pb-6 border-b border-white/[0.06]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-extrabold tracking-tight text-white font-sans">
                        ${price}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs text-neutral-400 font-medium">MXN</span>
                        <span className="text-[10px] text-neutral-500 font-mono">/ mes</span>
                      </div>
                    </div>

                    {billingCycle === "yearly" ? (
                      <p className="text-[11px] text-emerald-400 font-mono mt-2">
                        Facturado anualmente: ${plan.yearlyPrice} MXN (Ahorras 2 meses)
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-500 font-mono mt-2">
                        Sin compromisos a largo plazo.
                      </p>
                    )}
                  </div>

                  {/* Especificaciones Clave */}
                  <div className="py-5 space-y-2 border-b border-white/[0.06] text-xs font-medium text-neutral-300">
                    <div className="flex items-center gap-2.5">
                      <Store className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span>{plan.specs.branches}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span>{plan.specs.products}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span>{plan.specs.users}</span>
                    </div>
                  </div>

                  {/* Lista de Prestaciones Destacadas */}
                  <div className="pt-5 space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                      Incluye:
                    </span>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300 leading-snug">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isFeatured
                              ? "bg-white/15 text-white"
                              : "bg-white/[0.07] text-neutral-400"
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón de Conversión (CTA) */}
                <div className="mt-8 pt-4">
                  <Link
                    href={registerHref}
                    className={`w-full py-3.5 px-5 rounded-2xl text-xs font-semibold tracking-wide uppercase flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                      isFeatured
                        ? "bg-white text-black hover:bg-neutral-200 shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.35)] active:scale-[0.98]"
                        : "bg-white/[0.05] hover:bg-white/[0.12] text-white border border-white/[0.1] hover:border-white/[0.2] active:scale-[0.98]"
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <p className="text-[10px] text-center text-neutral-500 mt-2.5">
                    14 días sin costo · No requiere tarjeta
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ==================== SELLOS DE CONFIANZA ==================== */}
        <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-2 select-none">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center text-center">
            <Clock className="w-4 h-4 text-neutral-400 mb-1.5" />
            <span className="text-xs font-semibold text-neutral-200">14 Días de Prueba</span>
            <span className="text-[10px] text-neutral-500">Acceso total inmediato</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center text-center">
            <CreditCard className="w-4 h-4 text-neutral-400 mb-1.5" />
            <span className="text-xs font-semibold text-neutral-200">Sin Tarjeta Bancaria</span>
            <span className="text-[10px] text-neutral-500">Registro en 30 segundos</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center text-center">
            <Percent className="w-4 h-4 text-neutral-400 mb-1.5" />
            <span className="text-xs font-semibold text-neutral-200">0% Comisiones</span>
            <span className="text-[10px] text-neutral-500">Tus ventas son 100% tuyas</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center text-center">
            <ShieldCheck className="w-4 h-4 text-neutral-400 mb-1.5" />
            <span className="text-xs font-semibold text-neutral-200">Sin Contratos</span>
            <span className="text-[10px] text-neutral-500">Cancela cuando quieras</span>
          </div>
        </div>

        {/* ==================== TABLA COMPARATIVA DESPLEGABLE (ESTILO STRIPE) ==================== */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={() => setIsComparisonOpen(!isComparisonOpen)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-neutral-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all duration-300 cursor-pointer"
            >
              <span>{isComparisonOpen ? "Ocultar comparativa detallada" : "Ver comparativa técnica completa"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isComparisonOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {isComparisonOpen && (
            <div className="rounded-3xl border border-white/[0.08] bg-[#08080c]/90 backdrop-blur-2xl p-6 sm:p-8 overflow-x-auto shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in duration-300">
              <table className="w-full text-left border-collapse min-w-[580px]">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="py-4 px-4 text-xs font-mono uppercase tracking-wider text-neutral-400 w-2/5">
                      Capacidad
                    </th>
                    <th className="py-4 px-3 text-xs font-bold text-center text-neutral-300 w-1/5">
                      Arranque
                    </th>
                    <th className="py-4 px-3 text-xs font-bold text-center text-white bg-white/[0.03] rounded-t-xl w-1/5">
                      Crecimiento
                    </th>
                    <th className="py-4 px-3 text-xs font-bold text-center text-neutral-300 w-1/5">
                      Multi-Sucursal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_DATA.map((cat, catIdx) => (
                    <Fragment key={catIdx}>
                      <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                        <td
                          colSpan={4}
                          className="pt-6 pb-2.5 px-4 text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-400"
                        >
                          {cat.name}
                        </td>
                      </tr>
                      {cat.rows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 px-4 text-xs text-neutral-300 font-medium">
                            <span className={row.highlight ? "text-white font-semibold" : ""}>
                              {row.feature}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-center text-neutral-400">
                            {typeof row.arranque === "boolean" ? (
                              row.arranque ? (
                                <Check className="w-4 h-4 mx-auto text-neutral-200" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 mx-auto text-neutral-600" />
                              )
                            ) : (
                              row.arranque
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs text-center font-medium text-white bg-white/[0.03]">
                            {typeof row.crecimiento === "boolean" ? (
                              row.crecimiento ? (
                                <Check className="w-4 h-4 mx-auto text-emerald-400" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 mx-auto text-neutral-600" />
                              )
                            ) : (
                              row.crecimiento
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs text-center text-neutral-400">
                            {typeof row.multi === "boolean" ? (
                              row.multi ? (
                                <Check className="w-4 h-4 mx-auto text-neutral-200" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 mx-auto text-neutral-600" />
                              )
                            ) : (
                              row.multi
                            )}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ==================== PREGUNTAS FRECUENTES (FAQ ACORDEÓN) ==================== */}
        <div className="mt-28 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 block mb-2">
              Dudas comunes
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Preguntas Frecuentes
            </h3>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-md overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(item.id)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-sm font-medium text-neutral-200">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed border-t border-white/[0.04] animate-in fade-in duration-200">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================== BANNER FINAL DE CONVERSIÓN ==================== */}
        <div className="mt-28 max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 relative overflow-hidden bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/[0.12] text-center backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div className="relative z-10 flex flex-col items-center">
            <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Empieza a blindar las ventas de tu negocio hoy.
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mb-8 leading-relaxed">
              Sin tarjeta bancaria, sin descargas complejas y sin contratos forzosos.
              Configura tu catálogo en minutos y cobra a velocidad absoluta.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase bg-white text-black hover:bg-neutral-200 transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] active:scale-[0.98] cursor-pointer"
            >
              <span>Comenzar prueba gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
