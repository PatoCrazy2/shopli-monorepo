"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import Hero3DViewer from "./Hero3DViewer";

export default function HeroSection() {
  // Definición de renglones exactos para el titular
  const line1 = ["El", "sistema"];
  const line2 = ["Operativo"];
  const line3 = ["para", "el", "comercio"];
  const line4 = ["moderno."];

  // Definición de renglones exactos para el texto secundario (3 renglones)
  const subtitleLines = [
    "Punto de venta offline-first con conciliación en tiempo real,",
    "auditorías ciegas de inventario y gestión",
    "multi-sucursal aislada.",
  ];

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleHovered, setIsGoogleHovered] = useState(false);

  const handleGoogleClick = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/onboarding" });
  };

  return (
    <main className="relative z-10 min-h-screen lg:h-screen lg:min-h-0 flex items-center justify-center max-w-7xl mx-auto px-6 sm:px-12 pt-20 lg:pt-16 pb-8 lg:pb-12 overflow-x-hidden">
      <div className="w-full relative flex flex-col lg:block items-center">
        
        {/* OBJETO 3D: A gran escala (35-40% visual), desplazado a la derecha y ligeramente hacia abajo, invadiendo el espacio del copy */}
        <div className="order-1 lg:order-none w-full lg:absolute lg:right-[-4%] xl:right-[-2%] lg:top-[56%] lg:-translate-y-1/2 lg:w-[48vw] lg:max-w-[720px] xl:max-w-[820px] flex items-center justify-center lg:justify-end pointer-events-none z-10">
          <div className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[380px] lg:max-w-none h-[280px] xs:h-[320px] sm:h-[380px] lg:h-[620px] xl:h-[700px] flex items-center justify-center [&_canvas]:pointer-events-auto">
            <Hero3DViewer />
          </div>
        </div>

        {/* BLOQUE DE COPY (60-65% de la composición horizontal): Titular dominante + Descripción + CTAs unificados a la izquierda */}
        <div className="order-2 lg:order-none relative z-20 flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:max-w-[62%] xl:max-w-[65%]">
          {/* Titular H1: Dividido en 4 renglones exactos con letra más grande */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.6rem] xl:text-[4.25rem] font-bold tracking-tight leading-[1.04] mb-6">
            {/* Renglón 1: El sistema */}
            <span className="block mb-1">
              {line1.map((word, index) => (
                <span
                  key={index}
                  className="inline-block mr-[0.3em] bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent animate-word"
                  style={{ animationDelay: `${index * 0.22}s` }}
                >
                  {word}
                </span>
              ))}
            </span>

            {/* Renglón 2: Operativo */}
            <span className="block mb-1">
              {line2.map((word, index) => (
                <span
                  key={index}
                  className="inline-block mr-[0.3em] bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent animate-word"
                  style={{ animationDelay: `${(2 + index) * 0.22}s` }}
                >
                  {word}
                </span>
              ))}
            </span>

            {/* Renglón 3: para el comercio */}
            <span className="block mb-1">
              {line3.map((word, index) => (
                <span
                  key={index}
                  className="inline-block mr-[0.3em] bg-gradient-to-b from-neutral-200 via-neutral-400 to-neutral-600 bg-clip-text text-transparent animate-word"
                  style={{ animationDelay: `${(3 + index) * 0.22 + 0.05}s` }}
                >
                  {word}
                </span>
              ))}
            </span>

            {/* Renglón 4: moderno. */}
            <span className="block">
              {line4.map((word, index) => (
                <span
                  key={index}
                  className="inline-block mr-[0.3em] bg-gradient-to-b from-neutral-200 via-neutral-400 to-neutral-600 bg-clip-text text-transparent animate-word"
                  style={{ animationDelay: `${(6 + index) * 0.22 + 0.05}s` }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>

          {/* Subtítulo descriptivo: Dividido en 3 renglones exactos */}
          <p
            className="text-sm sm:text-base xl:text-lg text-neutral-400 font-normal leading-relaxed mb-8 max-w-lg xl:max-w-xl"
            aria-label={subtitleLines.join(" ")}
          >
            {subtitleLines.map((line, lineIndex) => {
              // Calcular índice base para no cortar la secuencia de tiempo
              const prevCharsCount = subtitleLines
                .slice(0, lineIndex)
                .reduce((acc, l) => acc + l.length + 1, 0);

              return (
                <span key={lineIndex} className="block">
                  {line.split("").map((char, charIndex) => (
                    <span
                      key={charIndex}
                      className="animate-letter inline"
                      style={{
                        animationDelay: `${(1.9 + (prevCharsCount + charIndex) * 0.007).toFixed(3)}s`,
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              );
            })}
          </p>

          {/* Botones de Acción (CTA unificado fuerte y secundario con microinteracción sincronizada) */}
          <div
            className="flex flex-wrap items-center justify-center lg:justify-start gap-4 animate-fade-in"
            style={{ animationDelay: "1.9s", opacity: 0 }}
          >
            {/* Botón Principal: Comenzar prueba gratis */}
            <div className="relative group p-[1px] rounded-2xl overflow-hidden transition-all duration-300">
              <div
                className={`absolute -inset-[100%] metallic-border-glow blur-[3px] pointer-events-none transition-opacity duration-300 ${
                  isGoogleHovered ? "opacity-0" : "opacity-100"
                }`}
              />

              <Link
                href="/register"
                className={`relative z-10 inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-[#0e0e12]/90 hover:bg-[#14141a]/90 text-white font-semibold text-sm transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.35)] cursor-pointer backdrop-blur-xl border ${
                  isGoogleHovered ? "border-white/[0.14]" : "border-transparent"
                }`}
              >
                <span>Comenzar prueba gratis</span>
                <ArrowRight className="w-4 h-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
              </Link>
            </div>

            {/* Botón Secundario: Crear cuenta con Google */}
            <div
              onMouseEnter={() => setIsGoogleHovered(true)}
              onMouseLeave={() => setIsGoogleHovered(false)}
              className="relative group p-[1px] rounded-2xl overflow-hidden transition-all duration-300"
            >
              <div className="absolute -inset-[100%] google-border-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[3px] pointer-events-none" />

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleLoading}
                className="relative z-10 inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#08080a]/90 hover:bg-[#0c0c0f]/90 text-neutral-200 hover:text-white font-medium text-sm border border-white/[0.08] group-hover:border-transparent backdrop-blur-xl transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-50"
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
