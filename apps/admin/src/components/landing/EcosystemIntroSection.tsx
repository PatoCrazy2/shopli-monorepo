"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Zap,
  WifiOff,
  ShieldCheck,
  TrendingUp,
  ArrowDown,
  PackageSearch,
  ClipboardCheck,
  ShieldAlert,
  Wallet,
  Tags,
  Layers,
  CircleDollarSign,
  Globe,
} from "lucide-react";

type AppType = "pos" | "admin";

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const POS_FEATURES: FeatureItem[] = [
  {
    icon: PackageSearch,
    title: "Disponibilidad de stock al instante",
    description: "Busca productos y verifica existencias de tu sucursal en tiempo real sin salir del mostrador.",
  },
  {
    icon: ClipboardCheck,
    title: "Auditoría continua a puertas abiertas",
    description: "Realiza inventarios físicos sin cerrar tienda ni pausar ventas gracias a conciliación inteligente.",
  },
  {
    icon: ShieldAlert,
    title: "Prevención de robo hormiga diario",
    description: "Corte de caja con conteo a ciegas de 3 productos aleatorios para blindar mermas.",
  },
  {
    icon: Zap,
    title: "Cobro ultrarrápido a 60 FPS",
    description: "Catálogo táctil ágil y lectura de códigos con la cámara de tu celular sin equipo extra.",
  },
  {
    icon: Wallet,
    title: "Control de gastos de caja chica",
    description: "Registra salidas menores de efectivo al momento y mantén tu arqueo cuadrado al centavo.",
  },
  {
    icon: WifiOff,
    title: "Operación blindada sin internet",
    description: "Sigue cobrando, abriendo turnos y registrando ventas aunque la red falle por completo.",
  },
];

const ADMIN_FEATURES: FeatureItem[] = [
  {
    icon: Tags,
    title: "Catálogo masivo y generación de SKUs",
    description: "Carga manual o por CSV, asignación de códigos por cámara e impresión de etiquetas listas para el POS.",
  },
  {
    icon: Layers,
    title: "Inventarios y traspasos en tiempo real",
    description: "Trazabilidad de stock entre sucursales, cuadres de almacén y registro de movimientos sin fricción.",
  },
  {
    icon: ShieldCheck,
    title: "Auditorías y gestión de usuarios",
    description: "Revisión de cortes de caja, control de mermas y permisos estrictos para dueños, encargados y cajeros.",
  },
  {
    icon: TrendingUp,
    title: "Métricas de ganancia neta y bruta",
    description: "Reportes automáticos de ventas, rendimiento por producto, costos operativos y productividad de equipo.",
  },
  {
    icon: CircleDollarSign,
    title: "Gestión de gastos fijos y variables",
    description: "Monitorea desembolsos mayores y menores para blindar el flujo de efectivo y tu rentabilidad real.",
  },
  {
    icon: Globe,
    title: "Resumen ejecutivo en cualquier lugar",
    description: "Consulta desde tu celular o laptop las ventas del día, métricas semanales y utilidades al segundo.",
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
      className="relative z-20 w-full bg-[#050507] text-white pt-14 pb-10 lg:pt-20 lg:pb-14 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Titular sobrio y contenido (Estilo Resend: elegante, sin competir con el Hero) */}
        <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-200 mb-2">
          Dos aplicaciones. Una sola sincronización.
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed mb-8">
          ShopLI divide las operaciones de tu negocio en dos entornos especializados:
          tu mostrador de cobro y tu panel de control central.
        </p>

        {/* SELECTOR DE ICONOS PURO (Sin cajas externas ni bordes pesados) */}
        <div className="flex items-center justify-center gap-10 sm:gap-14 mb-10 select-none">
          {/* ICONO 1: ShopLI POS (shopli.svg ya es el icono con fondo negro redondeado) */}
          <button
            onClick={() => setActiveApp("pos")}
            className={`group flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${
              activeApp === "pos" ? "opacity-100 scale-100" : "opacity-40 hover:opacity-75 scale-95"
            }`}
          >
            <div
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] sm:rounded-[26px] overflow-hidden transition-all duration-300 flex items-center justify-center ${
                activeApp === "pos"
                  ? "shadow-[0_16px_36px_rgba(0,0,0,0.9),0_0_25px_rgba(255,255,255,0.08)] ring-1 ring-white/20"
                  : "shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
              }`}
            >
              <Image
                src="/shopli.svg"
                alt="ShopLI POS Icon"
                fill
                unoptimized
                priority
                className="object-contain"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-medium tracking-tight text-neutral-200">
                ShopLI POS
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                Mostrador Móvil
              </span>
            </div>
          </button>

          {/* ICONO 2: ShopLI Admin (squircle blanco cerámico + isotipo negro shopli_snbg.svg) */}
          <button
            onClick={() => setActiveApp("admin")}
            className={`group flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${
              activeApp === "admin" ? "opacity-100 scale-100" : "opacity-40 hover:opacity-75 scale-95"
            }`}
          >
            <div
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] sm:rounded-[26px] bg-white transition-all duration-300 flex items-center justify-center overflow-hidden ${
                activeApp === "admin"
                  ? "shadow-[0_16px_36px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.18)] ring-1 ring-white/40"
                  : "shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
              }`}
            >
              <Image
                src="/shopli_snbg.svg"
                alt="ShopLI Admin Icon"
                fill
                unoptimized
                priority
                className="object-contain"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-medium tracking-tight text-neutral-200">
                ShopLI Admin
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                Centro Cloud
              </span>
            </div>
          </button>
        </div>

        {/* FUNCIONALIDADES: GRID MINIMALISTA LIMPIO (Alineación pixel-perfect con leading-5) */}
        <div className="w-full max-w-3xl pt-6 border-t border-white/[0.06]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 text-left">
            {(activeApp === "pos" ? POS_FEATURES : ADMIN_FEATURES).map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center text-neutral-400">
                    <Icon className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-neutral-200 leading-5 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400/80 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enlace sutil de transición */}
          {activeApp === "pos" && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={scrollToPhoneShowcase}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>Ver demostración</span>
                <ArrowDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
