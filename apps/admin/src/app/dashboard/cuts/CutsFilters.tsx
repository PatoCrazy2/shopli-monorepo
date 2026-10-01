"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X, Building2, Calendar, RotateCcw } from "lucide-react";

interface Sucursal {
  id: string;
  nombre: string;
}

interface CutsFiltersProps {
  sucursales: Sucursal[];
  currentSucursal?: string;
  currentDate?: string;
}

export default function CutsFilters({
  sucursales,
  currentSucursal,
  currentDate,
}: CutsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = (currentSucursal ? 1 : 0) + (currentDate ? 1 : 0);

  return (
    <>
      {/* 1. Vista Desktop (Inline clásico) */}
      <form method="GET" className="hidden md:flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
            Sucursal
          </label>
          <select
            name="sucursal"
            defaultValue={currentSucursal || ""}
            className="h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all appearance-none pr-10 relative min-w-[180px] text-zinc-900 dark:text-zinc-100"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")',
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px",
            }}
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
            Fecha de Apertura
          </label>
          <input
            type="date"
            name="date"
            defaultValue={currentDate || ""}
            className="h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <button
          type="submit"
          className="h-11 mt-auto px-6 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          Filtrar
        </button>

        {activeCount > 0 && (
          <Link
            href="/dashboard/cuts"
            className="h-11 mt-auto px-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* 2. Disparador Móvil (Botón compacto y ergonómico) */}
      <div className="flex md:hidden items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all active:scale-95 ${
            activeCount > 0
              ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800"
          }`}
          aria-label="Abrir filtros de cortes"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtros</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 text-[10px] font-black flex items-center justify-center ml-0.5 shadow-xs">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <Link
            href="/dashboard/cuts"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            aria-label="Limpiar filtros activos"
          >
            <RotateCcw className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* 3. Drawer Móvil (Bottom Sheet) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Sheet */}
          <div
            className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-[28px] shadow-2xl p-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] animate-in slide-in-from-bottom duration-300 ease-out"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de cortes"
          >
            {/* Header del Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900 mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Filtrar Cortes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full"
                aria-label="Cerrar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario móvil */}
            <form method="GET" onSubmit={() => setIsOpen(false)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Sucursal</span>
                </label>
                <select
                  name="sucursal"
                  defaultValue={currentSucursal || ""}
                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-semibold text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all appearance-none pr-10"
                  style={{
                    backgroundImage:
                      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")',
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    backgroundSize: "18px",
                  }}
                >
                  <option value="">Todas las sucursales</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Fecha de Apertura</span>
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={currentDate || ""}
                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-semibold text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
              </div>

              <div className="pt-3 flex items-center gap-3">
                {activeCount > 0 && (
                  <Link
                    href="/dashboard/cuts"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 min-h-[48px] flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                  >
                    Limpiar
                  </Link>
                )}
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
                >
                  Aplicar Filtros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
