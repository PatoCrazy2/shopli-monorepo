import React from "react";
import Image from "next/image";

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
          {/* Izquierda: Catálogo (Mediano) */}
          <div className="md:col-span-5 bg-[#050507] h-[400px] md:h-[650px] relative overflow-hidden group flex items-center justify-center">
            {/* Placeholder Visual - Reemplazar con <Image> del screenshot */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-[#050507] transition-transform duration-700 group-hover:scale-105" />
            <span className="relative z-10 text-white/20 font-light tracking-wide text-sm uppercase">
              Placeholder: Catálogo
            </span>
          </div>

          {/* Derecha: Dashboard y Analíticas (Muy Grande - Pantalla con aire top/left) */}
          <div className="md:col-span-7 bg-[#050507] h-[500px] md:h-[650px] relative overflow-hidden group pt-8 pl-8 sm:pt-12 sm:pl-12 flex flex-col justify-end">
            {/* Marco de Pantalla Flotante */}
            <div className="relative w-full h-full rounded-tl-2xl overflow-hidden border-t border-l border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] bg-zinc-950">
              <Image
                src="/features/analitycs.webp"
                alt="Dashboard y Analíticas de ShopLI"
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover object-left-top transition-transform duration-700 ease-out group-hover:scale-[1.015]"
              />
            </div>
          </div>

          {/* ================= FILA 2 ================= */}
          {/* 3 Columnas para features secundarias pero críticas */}
          {/* Col 1: Cortes de Caja */}
          <div className="md:col-span-4 bg-[#050507] h-[300px] md:h-[450px] relative overflow-hidden group flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-[#050507] transition-transform duration-700 group-hover:scale-105" />
            <span className="relative z-10 text-white/20 font-light tracking-wide text-sm uppercase">
              Placeholder: Cortes de Caja
            </span>
          </div>

          {/* Col 2: Gastos & Auditoría */}
          <div className="md:col-span-4 bg-[#050507] h-[300px] md:h-[450px] relative overflow-hidden group flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 to-[#050507] transition-transform duration-700 group-hover:scale-105" />
            <span className="relative z-10 text-white/20 font-light tracking-wide text-sm uppercase">
              Placeholder: Gastos & Auditoría
            </span>
          </div>

          {/* Col 3: Multi-Sucursal */}
          <div className="md:col-span-4 bg-[#050507] h-[300px] md:h-[450px] relative overflow-hidden group flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tl from-zinc-900/40 to-[#050507] transition-transform duration-700 group-hover:scale-105" />
            <span className="relative z-10 text-white/20 font-light tracking-wide text-sm uppercase">
              Placeholder: Multi-Sucursal
            </span>
          </div>

          {/* ================= FILA 3 ================= */}
          {/* Izquierda: Historial de Ventas / Reportes detallados (Ancho) */}
          <div className="md:col-span-8 bg-[#050507] h-[400px] md:h-[550px] relative overflow-hidden group flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/30 to-[#050507] transition-transform duration-700 group-hover:scale-105" />
            <span className="relative z-10 text-white/20 font-light tracking-wide text-sm uppercase">
              Placeholder: Historial & Reportes
            </span>
          </div>

          {/* Derecha: Inventario (Restante) */}
          <div className="md:col-span-4 bg-[#050507] h-[400px] md:h-[550px] relative overflow-hidden group flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-l from-zinc-900/30 to-[#050507] transition-transform duration-700 group-hover:scale-105" />
            <span className="relative z-10 text-white/20 font-light tracking-wide text-sm uppercase">
              Placeholder: Inventario
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
