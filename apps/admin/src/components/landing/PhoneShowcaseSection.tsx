"use client";

import { useRef } from "react";
import Image from "next/image";

export default function PhoneShowcaseSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <section
      id="capacidades"
      className="relative z-20 w-full min-h-screen py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center overflow-hidden bg-[#050507]"
    >
      {/* Luz ambiental de fondo de lujo (Glow difuso platino/cromo) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-gradient-to-tr from-white/[0.03] via-neutral-400/[0.04] to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[680px] bg-white/[0.02] rounded-full blur-[90px]" />
      </div>

      {/* Encabezado de la sección */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs sm:text-sm text-neutral-300 mb-4 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Experiencia de Punto de Venta</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Velocidad táctil.{" "}
          <span className="bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
            Cero fricción.
          </span>
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Diseñado para responder en milisegundos con o sin internet. Apertura de caja, escaneo de alta precisión y tickets instantáneos.
        </p>
      </div>

      {/* Contenedor del Teléfono con Calibración Milimétrica */}
      <div className="relative z-10 perspective-showcase flex items-center justify-center w-full max-w-5xl">
        <div
          className="relative preserve-3d w-[290px] xs:w-[320px] sm:w-[350px] md:w-[380px] lg:w-[410px] aspect-[2620/5416] transition-transform duration-500"
          style={{
            filter: "drop-shadow(0 25px 60px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.05))",
          }}
        >
          {/* Capa 1: Halo de luz detrás del chasis */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-white/10 via-white/5 to-transparent rounded-[50px] blur-2xl opacity-40 pointer-events-none -z-10" />

          {/* Capa 2: Contenedor de Pantalla Recortada (Bajo el Bezel) */}
          <div
            className="absolute overflow-hidden bg-black z-10"
            style={{
              top: "1.64%",
              bottom: "1.61%",
              left: "4.08%",
              right: "4.08%",
              borderRadius: "7.6%",
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              loop
              preload="auto"
              poster="/pos-demo-poster.webp"
              className="w-full h-full object-cover select-none pointer-events-none"
            >
              <source src="/pos-demo.webm" type="video/webm" />
              <source src="/pos-demo.mp4" type="video/mp4" />
            </video>

            {/* Capa de reflejo de cristal cerámico */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent z-20" />
          </div>

          {/* Capa 3: Mockup PNG Real Superpuesto con Dynamic Island y Biseles */}
          <Image
            src="/mockup.png"
            alt="ShopLI POS iPhone 16 Frame"
            fill
            sizes="(max-width: 640px) 320px, (max-width: 1024px) 380px, 420px"
            priority
            className="pointer-events-none select-none z-30 object-contain"
          />
        </div>
      </div>
    </section>
  );
}
