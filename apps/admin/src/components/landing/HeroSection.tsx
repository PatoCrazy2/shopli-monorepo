"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import Hero3DViewer from "./Hero3DViewer";

export default function HeroSection() {
  // Frase 1 y Frase 2 del título para animar palabra por palabra
  const line1Words = ["El", "sistema", "operativo"];
  const line2Words = ["para", "el", "comercio", "moderno."];

  // Texto del subtítulo para animar letra por letra
  const subtitleText =
    "Punto de venta offline-first con conciliación en tiempo real, auditorías ciegas de inventario y gestión multi-sucursal aislada.";

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleClick = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/onboarding" });
  };

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
            {/* Botón Principal: Comenzar prueba gratis */}
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] text-white font-medium text-sm border border-white/[0.16] backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.08)] cursor-pointer"
            >
              <span>Comenzar prueba gratis</span>
              <ArrowRight className="w-4 h-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>

            {/* Botón Secundario: Crear cuenta con Google con borde de luz perimetral rotativa en hover */}
            <div className="relative group p-[1px] rounded-2xl overflow-hidden transition-all duration-300">
              {/* Luz desenfocada perimetral que gira en hover con los colores de Google */}
              <div className="absolute -inset-[100%] google-border-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[3px] pointer-events-none" />

              {/* Botón interior con fondo oscuro de lujo y backdrop-blur */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleLoading}
                className="relative z-10 inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#08080a]/90 hover:bg-[#0c0c0f]/90 text-neutral-200 hover:text-white font-medium text-sm border border-white/[0.08] group-hover:border-transparent backdrop-blur-xl transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Crear cuenta con Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
