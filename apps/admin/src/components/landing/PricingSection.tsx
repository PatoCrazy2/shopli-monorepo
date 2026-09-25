"use client";

import { useState, Fragment } from "react";
import Image from "next/image";
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
  MessageCircle,
  Mail,
} from "lucide-react";
import { ContactDialog } from "./ContactDialog";


type BillingCycle = "monthly" | "yearly";

interface PricingPlan {
  id: string;
  name: string;
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
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactPlan, setContactPlan] = useState<string | undefined>(undefined);
  const [hoveredPlanId, setHoveredPlanId] = useState<string | null>(null);

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
          {/* Label de Sección Monospaced (Sin Badge) */}
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-400 mb-4 block">
            Precios & Retorno de Inversión
          </span>

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
                className={`relative flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span>Facturación Anual</span>
                <span
                  className={`text-[11px] font-mono tracking-tight transition-colors ${
                    billingCycle === "yearly"
                      ? "text-neutral-600 font-semibold"
                      : "text-neutral-400 font-normal"
                  }`}
                >
                  · 2 meses bonificados
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
            const isHovered = hoveredPlanId === plan.id;
            const registerHref = `/register?plan=${plan.id}`;

            const planKey = plan.id.toUpperCase();
            const isArranque = planKey === "ARRANQUE";
            const isCrecimiento = planKey === "CRECIMIENTO" || isFeatured;
            const isMultiSucursal = planKey === "MULTISUCURSAL";

            // Clase cromática del haz viajero según el plan
            const beamClass = isArranque
              ? "border-beam-glow-blue"
              : isMultiSucursal
              ? "border-beam-glow-amber"
              : "border-beam-glow";

            // Opacidad dinámica con "mute":
            // Si Crecimiento no tiene hover pero OTRA tarjeta sí, Crecimiento se apaga (opacity-0).
            const beamOpacity = isCrecimiento
              ? hoveredPlanId === null
                ? "opacity-40"
                : isHovered
                ? "opacity-100"
                : "opacity-0"
              : isHovered
              ? "opacity-100"
              : "opacity-0";

            // Color del borde estático y resplandor al interactuar
            const borderStaticClass = isCrecimiento
              ? hoveredPlanId === null
                ? "border border-white/20"
                : isHovered
                ? "border border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.12)]"
                : "border border-white/[0.08]"
              : isArranque
              ? isHovered
                ? "border border-sky-400/50 shadow-[0_0_30px_rgba(56,189,248,0.2)]"
                : "border border-white/[0.08]"
              : isMultiSucursal
              ? isHovered
                ? "border border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                : "border border-white/[0.08]"
              : "border border-white/[0.08]";

            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHoveredPlanId(plan.id)}
                onMouseLeave={() => setHoveredPlanId(null)}
                className={`relative p-[1px] rounded-[28px] overflow-hidden group transition-all duration-300 ${
                  isFeatured ? "lg:-translate-y-3 z-10" : "z-0"
                }`}
              >
                {/* 1. Halo difuso exterior (Bloom) para que la luz tiña el borde y el fondo */}
                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350%] h-[350%] pointer-events-none transition-opacity duration-300 ease-out z-0 blur-[6px] ${beamOpacity}`}
                >
                  <div className={`w-full h-full ${beamClass}`} />
                </div>

                {/* 2. Haz de luz nítido viajero continuo */}
                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350%] h-[350%] pointer-events-none transition-opacity duration-300 ease-out z-0 ${beamOpacity}`}
                >
                  <div className={`w-full h-full ${beamClass}`} />
                </div>

                {/* Borde sutil estático (delgado y discreto) */}
                <div
                  className={`absolute inset-0 rounded-[28px] pointer-events-none z-10 transition-all duration-300 ${borderStaticClass}`}
                />

                {/* Contenedor interior de la tarjeta */}
                <div className="relative w-full h-full rounded-[27px] bg-[#050507] overflow-hidden p-7 sm:p-9 flex flex-col justify-between z-10">
                  {/* Fondo ambiental texturizado con la imagen del Hero */}
                  <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
                    <Image
                      src="/shopli-new-hero.webp"
                      alt="ShopLI Hero Ambient"
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      priority={isFeatured}
                      className="object-cover object-center opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                    {/* Viñeta oscura con gradiente para garantizar contraste WCAG AAA */}
                    <div className="absolute inset-0 bg-[#050507]/75 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/60 via-[#050507]/85 to-[#050507]/95" />
                  </div>

                  {/* Halo ambiental cromático superior en el fondo de la tarjeta */}
                  <div
                    className={`absolute -top-14 left-1/2 -translate-x-1/2 w-56 h-28 blur-3xl rounded-full pointer-events-none z-0 transition-all duration-500 ${
                      isArranque
                        ? isHovered
                          ? "bg-sky-500/25 opacity-100"
                          : "opacity-0"
                        : isMultiSucursal
                        ? isHovered
                          ? "bg-amber-500/25 opacity-100"
                          : "opacity-0"
                        : hoveredPlanId === null
                        ? "bg-white/[0.08] opacity-100"
                        : isHovered
                        ? "bg-white/[0.18] opacity-100"
                        : "opacity-0"
                    }`}
                  />


                  {/* Contenido Superior de la Tarjeta */}
                  <div className="relative z-10">
                    {/* Categoría Target del Plan (Sin Badge) */}
                    <div className="flex items-center justify-between min-h-[24px] mb-4">
                      <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                        {plan.target}
                      </span>
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
                        <p className="text-[11px] text-zinc-300 font-mono mt-2">
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
                  <div className="relative z-10 mt-8 pt-4">
                    {isFeatured ? (
                      <div className="relative group/btn p-[1px] rounded-2xl overflow-hidden transition-all duration-300">
                        <div className="absolute -inset-[100%] metallic-border-glow blur-[3px] pointer-events-none opacity-100" />
                        <Link
                          href={registerHref}
                          className="relative z-10 w-full py-3.5 px-5 rounded-2xl bg-[#0e0e12]/90 hover:bg-[#14141a]/90 text-white font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.35)] cursor-pointer backdrop-blur-xl border border-transparent hover:border-white/[0.14] active:scale-[0.98]"
                        >
                          <span>{plan.ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-300 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:text-white" />
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href={registerHref}
                        className="w-full py-3.5 px-5 rounded-2xl text-xs font-semibold tracking-wide uppercase flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer bg-white/[0.05] hover:bg-white/[0.12] text-white border border-white/[0.1] hover:border-white/[0.2] active:scale-[0.98]"
                      >
                        <span>{plan.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <p className="text-[10px] text-center text-neutral-500 mt-2.5">
                      14 días sin costo · No requiere tarjeta
                    </p>
                  </div>
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
                                <Check className="w-4 h-4 mx-auto text-white" />
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
        <div id="faq" className="mt-28 max-w-3xl mx-auto scroll-mt-24">
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

        {/* ==================== BANNER FINAL DUAL: CONVERSIÓN + CONTACTO ESPECIAL ==================== */}
        <div id="contacto" className="mt-28 max-w-5xl mx-auto rounded-3xl p-8 sm:p-12 relative overflow-hidden bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/[0.12] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] scroll-mt-24">
          {/* Divisor Visual Central en Desktop */}
          <div className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-white/[0.12] to-transparent pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
            {/* Lado Izquierdo: Conversión Directa de Autoservicio */}
            <div className="flex flex-col justify-between items-center lg:items-start text-center lg:text-left h-full">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-2 block">
                  Comienza hoy
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                  Empieza a blindar las ventas de tu negocio.
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-md mb-8 leading-relaxed">
                  Sin tarjeta bancaria, sin descargas complejas y sin contratos forzosos.
                  Configura tu catálogo en minutos y cobra a velocidad absoluta.
                </p>
              </div>

              <div className="w-full sm:w-auto">
                <div className="relative group/bottom p-[1px] rounded-2xl overflow-hidden transition-all duration-300 w-full sm:w-auto">
                  <div className="absolute -inset-[100%] metallic-border-glow blur-[3px] pointer-events-none opacity-100" />
                  <Link
                    href="/register"
                    className="relative z-10 inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#0e0e12]/90 hover:bg-[#14141a]/90 text-white font-semibold text-xs sm:text-sm tracking-wide uppercase transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.35)] cursor-pointer backdrop-blur-xl border border-transparent hover:border-white/[0.14] active:scale-[0.98] w-full sm:w-auto"
                  >
                    <span>Comenzar prueba gratis</span>
                    <ArrowRight className="w-4 h-4 text-neutral-300 transition-transform group-hover/bottom:translate-x-0.5 group-hover/bottom:text-white" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Lado Derecho: Contacto, Asesoría y WhatsApp */}
            <div className="flex flex-col justify-between items-center lg:items-start text-center lg:text-left pt-8 lg:pt-0 border-t border-white/[0.08] lg:border-t-0 h-full">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-2 block">
                  Asesoría & Contacto Directo
                </span>
                <h4 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                  ¿Tienes dudas o necesitas un plan a medida?
                </h4>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-md mb-8 leading-relaxed">
                  Habla directamente con nosotros para resolver tus preguntas de implementación, conocer el sistema o estructurar una propuesta para tu negocio.
                </p>
              </div>
              
              <div className="w-full">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  {/* Botón WhatsApp con Llenado Líquido Semi-Luma Esmeralda */}
                  <a
                    href="/api/contact/whatsapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group/wa overflow-hidden flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/[0.04] text-white font-medium text-xs tracking-wide border border-white/[0.1] hover:border-emerald-500/40 transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-[0.98]"
                  >
                    {/* Cortina Líquida que emerge desde abajo */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 z-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-emerald-500/20 translate-y-full group-hover/wa:translate-y-0 transition-transform duration-300 ease-out pointer-events-none"
                    />
                    {/* Resplandor tenue en la base */}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 group-hover/wa:opacity-100 transition-opacity duration-300"
                    />
                    {/* Contenido Elevado */}
                    <span className="relative z-10 flex items-center justify-center gap-2 transition-transform duration-200 group-hover/wa:-translate-y-0.5">
                      <MessageCircle className="w-4 h-4 text-emerald-400 group-hover/wa:text-emerald-300 transition-colors" />
                      <span className="font-semibold text-neutral-100 group-hover/wa:text-white">WhatsApp</span>
                    </span>
                  </a>
                  
                  {/* Botón Correo con Llenado Líquido Plata Líquida Monocromática */}
                  <button
                    type="button"
                    onClick={() => {
                      setContactPlan("Asesoría General / Plan a Medida");
                      setIsContactOpen(true);
                    }}
                    className="relative group/mail overflow-hidden flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/[0.02] text-neutral-300 hover:text-white font-medium text-xs tracking-wide border border-white/[0.07] hover:border-white/30 transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.98]"
                  >
                    {/* Cortina Líquida Plata Líquida que emerge desde abajo */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-800/85 via-white/10 to-white/20 translate-y-full group-hover/mail:translate-y-0 transition-transform duration-300 ease-out pointer-events-none"
                    />
                    {/* Resplandor tenue en la base */}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover/mail:opacity-100 transition-opacity duration-300"
                    />
                    {/* Contenido Elevado */}
                    <span className="relative z-10 flex items-center justify-center gap-2 transition-transform duration-200 group-hover/mail:-translate-y-0.5">
                      <Mail className="w-4 h-4 text-neutral-400 group-hover/mail:text-white transition-colors" />
                      <span className="font-semibold text-neutral-200 group-hover/mail:text-white">Enviar correo</span>
                    </span>
                  </button>
                </div>

                <span className="text-[10px] text-neutral-500 font-mono mt-3 block text-center lg:text-left">
                  Sin intermediarios · Atención directa del equipo fundador
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Contacto y Cotizaciones Seguras */}
      <ContactDialog
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        defaultPlan={contactPlan}
      />
    </section>

  );
}
