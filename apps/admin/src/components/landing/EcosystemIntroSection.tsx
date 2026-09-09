"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Smartphone,
  LayoutDashboard,
  Zap,
  ScanBarcode,
  WifiOff,
  Clock,
  Store,
  ShieldCheck,
  TrendingUp,
  Users,
  ChevronDown,
} from "lucide-react";

type AppType = "pos" | "admin";

interface FeaturePill {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const POS_FEATURES: FeaturePill[] = [
  {
    icon: Zap,
    title: "Venta Táctil Instantánea",
    description: "Catálogo ágil y cobro fluido optimizado a 60 FPS sin demoras.",
  },
  {
    icon: ScanBarcode,
    title: "Escáner con Cámara",
    description: "Lee códigos de barras comerciales o propios directo con tu celular.",
  },
  {
    icon: WifiOff,
    title: "100% Offline-First",
    description: "Sigue cobrando y registrando ventas incluso si se corta internet.",
  },
  {
    icon: Clock,
    title: "Arqueos & Cierres Ciegos",
    description: "Apertura en 2 toques y conciliación blindada sin descuadres.",
  },
];

const ADMIN_FEATURES: FeaturePill[] = [
  {
    icon: Store,
    title: "Control Multi-Sucursal",
    description: "Supervisa todas tus tiendas y almacenes desde un solo centro de mando.",
  },
  {
    icon: ShieldCheck,
    title: "Auditorías & Seguridad",
    description: "Registro estricto de cancelaciones, cambios de precio y ajustes de stock.",
  },
  {
    icon: TrendingUp,
    title: "Analítica de Utilidades",
    description: "Márgenes reales, ingresos diarios y balance financiero consolidado.",
  },
  {
    icon: Users,
    title: "Gestión de Roles",
    description: "Aislamiento total de permisos para Dueños, Encargados y Cajeros.",
  },
];

export default function EcosystemIntroSection() {
  const [activeApp, setActiveApp] = useState<AppType>("pos");

  const scrollToPhoneShowcase = () => {
    const el = document.getElementById("showcase-phone");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="capacidades"
      className="relative z-20 w-full bg-[#050507] text-white pt-20 pb-12 lg:pt-28 lg:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Luz ambiental difusa de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div
          className={`w-[600px] h-[350px] rounded-full blur-[140px] transition-all duration-700 ${
            activeApp === "pos"
              ? "bg-emerald-500/[0.04]"
              : "bg-blue-500/[0.04]"
          }`}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Tag de Categoría */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs text-neutral-300 mb-4 tracking-wide shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-300">
            Arquitectura Dual // Dos Aplicaciones
          </span>
        </div>

        {/* Titular Principal */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 max-w-3xl leading-[1.08]">
          Un solo negocio.{" "}
          <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
            Dos motores sincronizados.
          </span>
        </h2>

        {/* Bajada */}
        <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed mb-10">
          ShopLI integra tu caja física y tu centro de control en la nube en una
          sola plataforma sin fricción. Selecciona una app para explorar su propósito:
        </p>

        {/* DOCK DE HARDWARE CON RELIEVE 3D ESTILO APPLE */}
        <div className="relative inline-flex items-center gap-4 sm:gap-6 p-2.5 sm:p-3 rounded-[32px] bg-[#0b0b10]/90 border border-white/[0.08] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] mb-10">
          {/* BOTÓN 1: ShopLI POS */}
          <button
            onClick={() => setActiveApp("pos")}
            className={`group relative flex items-center gap-3.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-[24px] transition-all duration-300 cursor-pointer select-none ${
              activeApp === "pos"
                ? "bg-white/[0.06] border border-white/20 shadow-[0_12px_28px_rgba(0,0,0,0.7)]"
                : "border border-transparent hover:bg-white/[0.02] opacity-70 hover:opacity-100"
            }`}
          >
            {/* Icono POS con Relieve 3D Físico (Negro Obsidiana) */}
            <div
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-black border transition-all duration-300 flex items-center justify-center overflow-hidden shrink-0 ${
                activeApp === "pos"
                  ? "border-t-white/40 border-white/15 scale-105 shadow-[0_14px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.1),inset_0_1px_2px_rgba(255,255,255,0.4)]"
                  : "border-white/10 opacity-80 group-hover:opacity-100 group-hover:scale-100 shadow-[0_8px_18px_rgba(0,0,0,0.6)]"
              }`}
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11">
                <Image
                  src="/shopli.svg"
                  alt="ShopLI POS Icon"
                  fill
                  className="object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
                />
              </div>
              {/* Reflejo satinado en el bisel superior */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-semibold text-white tracking-tight">
                  ShopLI POS
                </span>
                {activeApp === "pos" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                Mostrador Móvil
              </span>
            </div>
          </button>

          {/* BOTÓN 2: ShopLI Admin */}
          <button
            onClick={() => setActiveApp("admin")}
            className={`group relative flex items-center gap-3.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-[24px] transition-all duration-300 cursor-pointer select-none ${
              activeApp === "admin"
                ? "bg-white/[0.06] border border-white/20 shadow-[0_12px_28px_rgba(0,0,0,0.7)]"
                : "border border-transparent hover:bg-white/[0.02] opacity-70 hover:opacity-100"
            }`}
          >
            {/* Icono Admin con Relieve 3D Físico (Blanco Cerámico) */}
            <div
              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-white border transition-all duration-300 flex items-center justify-center overflow-hidden shrink-0 ${
                activeApp === "admin"
                  ? "border-t-white border-neutral-300 scale-105 shadow-[0_14px_30px_rgba(0,0,0,0.9),0_0_25px_rgba(255,255,255,0.2),inset_0_1px_2px_rgba(255,255,255,1)]"
                  : "border-neutral-400 opacity-80 group-hover:opacity-100 group-hover:scale-100 shadow-[0_8px_18px_rgba(0,0,0,0.6)]"
              }`}
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11">
                <Image
                  src="/shopli_snbg.svg"
                  alt="ShopLI Admin Icon"
                  fill
                  className="object-contain"
                />
              </div>
              {/* Reflejo cerámico superior */}
              <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-neutral-200/30 pointer-events-none" />
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-semibold text-white tracking-tight">
                  ShopLI Admin
                </span>
                {activeApp === "admin" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                Panel Cloud
              </span>
            </div>
          </button>
        </div>

        {/* PANEL DINÁMICO DE CONTENIDO (ESTRUCTURA DE ALTO VALOR PERCIBIDO) */}
        <div className="w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-[#0a0a0f]/80 border border-white/[0.08] backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.7)] transition-all duration-500 text-left">
          {activeApp === "pos" ? (
            <div className="animate-fade-in">
              {/* Cabecera del Panel POS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mb-2">
                    <Smartphone className="w-3 h-3" />
                    PWA Offline-First
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Tu mostrador completo en cualquier teléfono o tablet
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
                    Diseñado para cajeros y encargados. Cobra a máxima velocidad sin
                    cables, terminales dedicadas ni contratos forzosos.
                  </p>
                </div>

                <button
                  onClick={scrollToPhoneShowcase}
                  className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer"
                >
                  <span>Ver en acción abajo</span>
                  <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                </button>
              </div>

              {/* Grid de 4 Pilares POS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {POS_FEATURES.map((feat, i) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-200 leading-snug">
                          {feat.title}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                          {feat.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Cabecera del Panel Admin */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 mb-2">
                    <LayoutDashboard className="w-3 h-3" />
                    Centro de Control Cloud
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    El centro de mando para el dueño del negocio
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
                    Acceso web seguro desde cualquier navegador o laptop. Controla
                    inventarios, sucursales y finanzas en tiempo real.
                  </p>
                </div>

                <div className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-neutral-300 text-xs font-medium">
                  <span>Sección detallada más adelante</span>
                </div>
              </div>

              {/* Grid de 4 Pilares Admin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ADMIN_FEATURES.map((feat, i) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-200 leading-snug">
                          {feat.title}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                          {feat.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CONECTOR VISUAL DE SCROLL HACIA EL SHOWCASE 3D */}
        <div
          onClick={scrollToPhoneShowcase}
          className="group inline-flex flex-col items-center mt-12 cursor-pointer select-none transition-opacity duration-300 opacity-60 hover:opacity-100"
        >
          <span className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase mb-2 group-hover:text-white transition-colors">
            Explora ShopLI POS en acción
          </span>
          <div className="w-6 h-9 rounded-full border border-white/20 flex items-start justify-center p-1.5 group-hover:border-white/40 transition-colors">
            <div className="w-1 h-2 bg-white rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
