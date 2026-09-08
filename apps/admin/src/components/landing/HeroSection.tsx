"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero3DViewer from "./Hero3DViewer";

export default function HeroSection() {
  // Frase 1 y Frase 2 del título para animar palabra por palabra
  const line1Words = ["El", "sistema", "operativo"];
  const line2Words = ["para", "el", "comercio", "moderno."];

  // Texto del subtítulo para animar letra por letra
  const subtitleText =
    "Punto de venta offline-first con conciliación en tiempo real, auditorías ciegas de inventario y gestión multi-sucursal aislada.";

  // Base delay para subtítulo: inicia en 1.0s después de las palabras del título
  const subtitleBaseDelay = 1.0;
  // Delay por letra: ~7.5ms por carácter (140 caracteres ≈ 1.05s)
  const letterDelayStep = 0.0075;

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center max-w-7xl mx-auto px-6 sm:px-12 pt-24 pb-16">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-8 items-center">
        {/* En móvil pasa arriba (order-1), caja proporcional limpia; en desktop a la derecha (lg:order-2) con altura completa */}
        <div className="order-1 lg:order-2 w-full flex items-center justify-center">
          <div className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[380px] lg:max-w-none h-[280px] xs:h-[320px] sm:h-[380px] lg:h-[540px] flex items-center justify-center">
            <Hero3DViewer />
          </div>
        </div>

        {/* En móvil pasa abajo del 3D (order-2), centrado o alineado a la izquierda */}
        <div className="order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl">
          {/* Titular H1: Animado palabra por palabra con ritmo pausado y cinematográfico (0.2s por palabra) */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-[1.08] mb-6">
            <span className="block mb-2">
              {line1Words.map((word, index) => (
                <span
                  key={index}
                  className="inline-block mr-[0.3em] bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent animate-word"
                  style={{ animationDelay: `${index * 0.22}s` }}
                >
                  {word}
                </span>
              ))}
            </span>
            <span className="block">
              {line2Words.map((word, index) => (
                <span
                  key={index}
                  className="inline-block mr-[0.3em] bg-gradient-to-b from-neutral-200 via-neutral-400 to-neutral-600 bg-clip-text text-transparent animate-word"
                  style={{
                    animationDelay: `${(line1Words.length + index) * 0.22 + 0.1}s`,
                  }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>

          {/* Subtítulo: Animado letra por letra rápido y fluido (inicia a los 1.9s, dura ~1s) */}
          <p
            className="text-sm sm:text-lg text-neutral-400 font-normal leading-relaxed mb-8 max-w-lg"
            aria-label={subtitleText}
          >
            {subtitleText.split("").map((char, index) => (
              <span
                key={index}
                className="animate-letter inline"
                style={{
                  animationDelay: `${(1.9 + index * 0.007).toFixed(3)}s`,
                }}
              >
                {char}
              </span>
            ))}
          </p>

          {/* Botones Glassmorphism de Lujo: Entran a los 1.9s cuando inicia el subtítulo */}
          <div
            className="flex flex-wrap items-center gap-4 animate-fade-in"
            style={{ animationDelay: "1.9s", opacity: 0 }}
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] text-white font-medium text-sm border border-white/[0.16] backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.08)] cursor-pointer"
            >
              <span>Comenzar prueba gratis</span>
              <ArrowRight className="w-4 h-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] text-neutral-300 hover:text-white font-medium text-sm border border-white/[0.06] hover:border-white/[0.12] backdrop-blur-md transition-all duration-300 cursor-pointer"
            >
              <span>Acceder a consola</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
