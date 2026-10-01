"use client";

import { useState } from "react";
import { X, ChevronRight } from "lucide-react";

interface Gasto {
  id: string;
  descripcion: string;
  monto: number | string;
}

interface ExpensesDetailsDrawerProps {
  gastos: Gasto[];
  totalGastos: number;
}

export default function ExpensesDetailsDrawer({
  gastos,
  totalGastos,
}: ExpensesDetailsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!gastos || gastos.length === 0) {
    return null;
  }

  // Lista reutilizable de gastos para Móvil y Desktop
  const renderExpensesList = () => (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-900 my-1">
      {gastos.map((g) => (
        <div
          key={g.id}
          className="py-2.5 flex items-center justify-between gap-4 text-xs font-mono"
        >
          <span className="font-sans font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
            {g.descripcion}
          </span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
            -${Number(g.monto).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Gatillo en la tarjeta: Toggle en Desktop y Disparador de Bottom Sheet en Mobile */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-mono transition-colors group cursor-pointer select-none"
        aria-expanded={isOpen}
        aria-label="Ver detalle de gastos de caja chica"
      >
        <span className="text-zinc-400">Gastos caja:</span>
        <span className="font-bold text-zinc-900 dark:text-zinc-100">
          -${totalGastos.toFixed(2)}
        </span>
        <span className="text-[11px] text-zinc-400">({gastos.length})</span>
        <ChevronRight
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-90" : "group-hover:translate-x-0.5"
          }`}
        />
      </button>

      {/* 1. VISTA DESKTOP: Despliegue inline bajo el botón (acordeón integrado) */}
      {isOpen && (
        <div className="hidden md:block w-full mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Gastos de Caja Chica • -${totalGastos.toFixed(2)} ({gastos.length} comprobantes)
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              [Cerrar]
            </button>
          </div>
          {renderExpensesList()}
        </div>
      )}

      {/* 2. VISTA MÓVIL: Drawer deslizable (Bottom Sheet) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end flex-col">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div
            className="relative z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-2xl p-5 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 ease-out max-w-2xl mx-auto w-full"
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de gastos de caja chica"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white uppercase">
                  Gastos de Caja Chica
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Total egresos: -${totalGastos.toFixed(2)} ({gastos.length} comprobantes)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Cerrar detalle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista detallada */}
            <div className="overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 my-2">
              {renderExpensesList()}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full min-h-[44px] bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
