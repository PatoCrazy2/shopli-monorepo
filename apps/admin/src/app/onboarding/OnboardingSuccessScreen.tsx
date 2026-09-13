"use client";

import { useEffect, useRef } from "react";

interface OnboardingSuccessScreenProps {
  businessName: string;
}

export function OnboardingSuccessScreen({ businessName }: OnboardingSuccessScreenProps) {
  const hasRedirected = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        window.location.href = "/dashboard/inicio";
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="fixed inset-0 z-50 min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 selection:bg-black selection:text-white font-sans text-center animate-in fade-in duration-300">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Header idéntico y consistente con el diseño de ShopLI */}
        <div className="mb-8">
          <img
            src="/shopli_snbg.svg"
            alt="ShopLI Logo"
            className="mx-auto w-20 h-20 mb-2 drop-shadow-sm"
          />
          <h1 className="text-2xl font-black tracking-tight text-black">
            ShopLI <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Admin</span>
          </h1>
        </div>

        {/* Icono central con palomita animada inspirada en POS */}
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-black text-white shadow-xl shadow-black/10 flex items-center justify-center animate-check-pop">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline
                points="20 6 9 17 4 12"
                className="animate-check-stroke"
              />
            </svg>
          </div>
        </div>

        {/* Título y descripción de éxito */}
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mb-2">
          ¡Todo listo para comenzar!
        </h2>
        <p className="text-zinc-500 text-sm sm:text-base leading-relaxed max-w-xs sm:max-w-sm">
          Tu empresa <span className="font-semibold text-zinc-900">{businessName}</span> y sucursal matriz han sido creadas exitosamente.
        </p>

        {/* Indicador inferior sutil con animación de carga en las letras */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs tracking-wide text-zinc-400 font-medium">
          <span className="animate-pulse">Accediendo al panel de control</span>
          <span className="inline-flex">
            <span className="animate-bounce [animation-delay:-0.3s]">.</span>
            <span className="animate-bounce [animation-delay:-0.15s]">.</span>
            <span className="animate-bounce">.</span>
          </span>
        </div>
      </div>
    </main>
  );
}
