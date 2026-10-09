import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function AdminFeaturesGrid() {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 py-24 md:py-32 flex flex-col items-center">
      {/* 
        El borde externo y las líneas divisorias internas de 1px se logran 
        con el background del contenedor padre (bg-white/[0.08]) y un gap de 1px.
        Las celdas tienen bg-[#050507] para tapar el fondo, dejando solo visible la línea de 1px.
      */}
      <div className="relative w-full bg-white/[0.06] border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[1px]">
          
          {/* ================= FILA 1 ================= */}
          {/* Izquierda: Catálogo (Mediano - iPhone 16 Showcase) */}
          <div className="md:col-span-5 bg-[#050507] h-[420px] sm:h-[450px] md:h-[480px] relative overflow-hidden group pt-6 px-6 sm:pt-8 sm:px-8 md:pt-10 md:px-10 pb-5 sm:pb-6 flex flex-col justify-between">
            {/* Contenedor Superior con el iPhone 16 alineado al inicio */}
            <div className="relative w-full flex-1 flex items-start justify-center overflow-hidden pt-2 sm:pt-3">
              <div className="relative w-[210px] sm:w-[230px] md:w-[240px] aspect-[2620/5416] drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)]">
                {/* Pantalla Calibrada */}
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
                  <Image
                    src="/features/catalog-v2.webp"
                    alt="Catálogo en móvil de ShopLI"
                    fill
                    sizes="(max-width: 768px) 230px, 260px"
                    className="object-cover object-top select-none pointer-events-none"
                  />
                  {/* Reflejo cerámico sutil */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent z-20" />
                </div>

                {/* Chasis Frontal iPhone 16 con Dynamic Island */}
                <Image
                  src="/mockup.webp"
                  alt="ShopLI iPhone 16 Front Frame"
                  fill
                  priority
                  className="pointer-events-none select-none z-30 object-contain"
                />
              </div>
            </div>

            {/* Enlace e info detallada en franja inferior */}
            <div className="pt-4 sm:pt-6">
              <Link
                href="#catalog"
                className="inline-flex items-center gap-2.5 group/link text-neutral-200 hover:text-white transition-colors"
              >
                <span className="text-sm sm:text-base font-medium tracking-tight">
                  Catálogo
                </span>
                <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center transition-all duration-300 group-hover/link:bg-white group-hover/link:text-black group-hover/link:border-white">
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </div>
              </Link>
            </div>
          </div>

          {/* Derecha: Dashboard y Analíticas (Muy Grande - Proporción equilibrada sin zoom excesivo) */}
          <div className="md:col-span-7 bg-[#050507] h-[420px] sm:h-[450px] md:h-[480px] relative overflow-hidden group pt-6 pl-6 sm:pt-8 sm:pl-8 md:pt-10 md:pl-10 pb-5 sm:pb-6 flex flex-col justify-between">
            {/* Marco de Pantalla Nítida con Recorte Geométrico (Sin degradados) */}
            <div className="relative w-full flex-1 rounded-l-2xl overflow-hidden border-t border-b border-l border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] bg-white">
              <Image
                src="/features/analytics-v2.webp"
                alt="Dashboard y Analíticas de ShopLI"
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover object-left-top"
              />
            </div>

            {/* Enlace e info detallada en franja inferior 100% libre de la imagen */}
            <div className="pt-6 sm:pt-7 pr-6">
              <Link
                href="#analytics"
                className="inline-flex items-center gap-2.5 group/link text-neutral-200 hover:text-white transition-colors"
              >
                <span className="text-sm sm:text-base font-medium tracking-tight">
                  Dashboard & Analíticas
                </span>
                <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center transition-all duration-300 group-hover/link:bg-white group-hover/link:text-black group-hover/link:border-white">
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </div>
              </Link>
            </div>
          </div>

          {/* ================= FILA 2 ================= */}
          {/* 3 Columnas para features secundarias pero críticas */}
          {/* Col 1: Cortes de Caja (Idéntico a Analytics: poco aire top/left y recorte a la derecha) */}
          <div className="md:col-span-4 bg-[#050507] h-[380px] sm:h-[420px] md:h-[450px] relative overflow-hidden group pt-5 pl-5 sm:pt-6 sm:pl-6 pb-5 sm:pb-6 flex flex-col justify-between">
            {/* Marco de Pantalla Nítida con Recorte Geométrico al ras derecho */}
            <div className="relative w-full flex-1 rounded-l-2xl overflow-hidden border-t border-b border-l border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)] bg-white">
              <Image
                src="/features/cortes-v2.webp"
                alt="Cortes de Caja de ShopLI"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-left-top select-none pointer-events-none"
              />
            </div>

            {/* Enlace e info detallada en franja inferior 100% libre */}
            <div className="pt-4 sm:pt-5 pr-5">
              <Link
                href="#cuts"
                className="inline-flex items-center gap-2.5 group/link text-neutral-200 hover:text-white transition-colors"
              >
                <span className="text-sm sm:text-base font-medium tracking-tight">
                  Cortes de Caja
                </span>
                <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center transition-all duration-300 group-hover/link:bg-white group-hover/link:text-black group-hover/link:border-white">
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </div>
              </Link>
            </div>
          </div>

          {/* Col 2: Gastos & Auditoría (Bloque Tipográfico Editorial con Luz Curva) */}
          <div className="md:col-span-4 bg-[#050507] h-[380px] sm:h-[420px] md:h-[450px] relative overflow-hidden group pt-5 px-5 sm:pt-6 sm:px-6 pb-5 sm:pb-6 flex flex-col justify-between">
            {/* Iluminación ambiental y curvas de luz estilo referencia */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              {/* Resplandor ambiental superior */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/[0.025] rounded-full blur-3xl" />
              
              {/* Arco / onda de luz diagonal inferior */}
              <div className="absolute -bottom-24 -right-16 w-96 h-96 rounded-[100%] border-t border-white/[0.14] bg-gradient-to-b from-white/[0.04] to-transparent blur-[0.5px] pointer-events-none transform -rotate-12 shadow-[inset_0_4px_20px_rgba(255,255,255,0.03)]" />
              <div className="absolute -bottom-28 -right-20 w-[420px] h-[420px] rounded-[100%] border-t border-white/[0.06] bg-transparent pointer-events-none transform -rotate-12" />
            </div>

            {/* Tipografía Central de Alto Impacto */}
            <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center text-center select-none px-2">
              <span className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-none">
                0% fugas
              </span>
              <span className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight bg-gradient-to-b from-neutral-300 via-neutral-500 to-neutral-700/25 bg-clip-text text-transparent leading-[1.08] mt-1 sm:mt-1.5">
                de capital
              </span>
            </div>

            {/* Enlace e info detallada en franja inferior */}
            <div className="relative z-10 pt-4 sm:pt-5">
              <Link
                href="#audits"
                className="inline-flex items-center gap-2.5 group/link text-neutral-200 hover:text-white transition-colors"
              >
                <span className="text-sm sm:text-base font-medium tracking-tight">
                  Gastos & Auditoría
                </span>
                <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center transition-all duration-300 group-hover/link:bg-white group-hover/link:text-black group-hover/link:border-white">
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </div>
              </Link>
            </div>
          </div>

          {/* Col 3: Multi-Sucursal (Video Autoplay ocupando todo el cuadro) */}
          <div className="md:col-span-4 bg-white h-[380px] sm:h-[420px] md:h-[450px] relative overflow-hidden group">
            {/* Video en loop continuo ocupando todo el cuadro */}
            <video
              src="/features/multisucursal-v2.webm"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
            />

            {/* Enlace e info detallada en esquina inferior izquierda */}
            <div className="absolute bottom-5 left-5 sm:bottom-6 sm:left-6 z-20">
              <Link
                href="#branches"
                className="inline-flex items-center gap-2.5 group/link text-neutral-900 hover:text-black transition-colors"
              >
                <span className="text-sm sm:text-base font-medium tracking-tight">
                  Multi-Sucursal
                </span>
                <div className="w-6 h-6 rounded-full bg-black/[0.08] border border-black/[0.12] flex items-center justify-center transition-all duration-300 group-hover/link:bg-black group-hover/link:text-white group-hover/link:border-black">
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </div>
              </Link>
            </div>
          </div>

          {/* ================= FILA 3 ================= */}
          {/* Izquierda: Historial de Ventas / Reportes detallados (Ancho con Laptop al centro) */}
          <div className="md:col-span-8 bg-[#050507] h-[440px] sm:h-[480px] md:h-[530px] relative overflow-hidden group pt-6 px-6 sm:pt-8 sm:px-8 md:pt-10 md:px-10 pb-5 sm:pb-6 flex flex-col justify-between">
            {/* Resplandor ambiental de fondo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-white/[0.025] blur-3xl rounded-full pointer-events-none" />

            {/* Contenedor central con la laptop centrada */}
            <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
              <div className="relative w-[330px] sm:w-[480px] md:w-[540px] lg:w-[620px] aspect-[2000/1165] drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:scale-[1.015]">
                {/* Pantalla Calibrada */}
                <div
                  className="absolute overflow-hidden bg-black z-10"
                  style={{
                    top: "7.35%",
                    bottom: "11.64%",
                    left: "12.14%",
                    right: "12.14%",
                    borderRadius: "2px",
                  }}
                >
                  <Image
                    src="/features/hist.webp"
                    alt="Historial y Reportes de ShopLI"
                    fill
                    sizes="(max-width: 768px) 100vw, 65vw"
                    className="object-cover object-[60%_top] select-none pointer-events-none"
                  />
                  {/* Reflejo de cristal sutil */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent z-20" />
                </div>

                {/* Chasis Frontal de la Laptop */}
                <Image
                  src="/features/laptop_chassis.webp"
                  alt="ShopLI Laptop Mockup"
                  fill
                  priority
                  className="pointer-events-none select-none z-30 object-contain"
                />
              </div>
            </div>

            {/* Enlace e info detallada en franja inferior */}
            <div className="pt-4 sm:pt-6">
              <Link
                href="#history"
                className="inline-flex items-center gap-2.5 group/link text-neutral-200 hover:text-white transition-colors"
              >
                <span className="text-sm sm:text-base font-medium tracking-tight">
                  Historial & Reportes
                </span>
                <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center transition-all duration-300 group-hover/link:bg-white group-hover/link:text-black group-hover/link:border-white">
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </div>
              </Link>
            </div>
          </div>

          {/* Derecha: Inventario (iPhone Completo) */}
          <div className="md:col-span-4 bg-[#050507] h-[440px] sm:h-[480px] md:h-[530px] relative overflow-hidden group pt-6 px-6 sm:pt-8 sm:px-8 pb-5 sm:pb-6 flex flex-col justify-between">
            {/* Contenedor central con iPhone completo */}
            <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
              <div className="relative h-[310px] sm:h-[350px] md:h-[385px] aspect-[2620/5416] drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)] transition-transform duration-500 group-hover:scale-[1.02]">
                {/* Pantalla Calibrada */}
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
                  <Image
                    src="/features/inv.webp"
                    alt="Inventario en móvil de ShopLI"
                    fill
                    sizes="(max-width: 768px) 200px, 240px"
                    className="object-cover object-top select-none pointer-events-none"
                  />
                  {/* Reflejo cerámico sutil */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent z-20" />
                </div>

                {/* Chasis Frontal iPhone 16 con Dynamic Island */}
                <Image
                  src="/mockup.webp"
                  alt="ShopLI iPhone 16 Front Frame"
                  fill
                  priority
                  className="pointer-events-none select-none z-30 object-contain"
                />
              </div>
            </div>

            {/* Enlace e info detallada en franja inferior */}
            <div className="pt-4 sm:pt-6">
              <Link
                href="#inventory"
                className="inline-flex items-center gap-2.5 group/link text-neutral-200 hover:text-white transition-colors"
              >
                <span className="text-sm sm:text-base font-medium tracking-tight">
                  Inventario
                </span>
                <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center transition-all duration-300 group-hover/link:bg-white group-hover/link:text-black group-hover/link:border-white">
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
