"use client";

import { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { resolveAuditItem } from "./actions";

interface AuditItem {
  id: string;
  expectedStock: number;
  countedStock: number;
  discrepancy: number;
  resolved: boolean;
  reason?: string | null;
  comments?: string | null;
  producto: {
    nombre: string;
    codigo_interno: string;
  };
}

interface Auditoria {
  id: string;
  items: AuditItem[];
}

interface AuditDetailsDrawerProps {
  auditorias: Auditoria[];
  sucursalId: string;
}

export default function AuditDetailsDrawer({
  auditorias,
  sucursalId,
}: AuditDetailsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!auditorias || auditorias.length === 0) {
    return null;
  }

  // Aplanar todos los ítems de las auditorías del turno
  const allItems = auditorias.flatMap((a) => a.items);
  if (allItems.length === 0) {
    return null;
  }

  const discrepantItems = allItems.filter((i) => i.discrepancy !== 0);
  const pendingItems = discrepantItems.filter((i) => !i.resolved);
  const hasDiscrepancy = discrepantItems.length > 0;

  return (
    <>
      {/* Gatillo en la tarjeta: Tipografía sobria, cero emojis, cero burbujas saturadas */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors group cursor-pointer text-left"
        aria-label="Ver auditoría de inventario a ciegas"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            !hasDiscrepancy
              ? "bg-zinc-400 dark:bg-zinc-600"
              : pendingItems.length > 0
              ? "bg-amber-600 dark:bg-amber-500 animate-pulse"
              : "bg-zinc-900 dark:bg-zinc-100"
          }`}
        />
        <span className="text-zinc-500 dark:text-zinc-400">Inventario:</span>
        <span
          className={`font-semibold ${
            !hasDiscrepancy
              ? "text-zinc-700 dark:text-zinc-300"
              : pendingItems.length > 0
              ? "text-amber-800 dark:text-amber-300 font-bold"
              : "text-zinc-900 dark:text-zinc-100 font-medium"
          }`}
        >
          {!hasDiscrepancy
            ? `Conforme (${allItems.length} ítems)`
            : `${discrepantItems.length} con diferencia (${pendingItems.length} pendientes)`}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>

      {/* Drawer deslizable (Bottom Sheet) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end flex-col">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div
            className="relative z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-2xl p-5 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-300 ease-out max-w-2xl mx-auto w-full"
            role="dialog"
            aria-modal="true"
            aria-label="Auditoría de inventario a ciegas"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white uppercase">
                  Auditoría de Inventario a Ciegas
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {allItems.length} productos verificados • {discrepantItems.length} discrepancias
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Cerrar auditoría"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista detallada de productos auditados */}
            <div className="overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 my-2 pr-1 space-y-2">
              {allItems.map((item) => {
                const isDiscrepant = item.discrepancy !== 0;
                return (
                  <div key={item.id} className="pt-3 pb-2 space-y-2">
                    {/* Fila del Producto */}
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {item.producto.nombre}
                        </span>
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                          SKU: {item.producto.codigo_interno}
                        </div>
                      </div>

                      {/* Métricas: Sistema vs Conteo */}
                      <div className="flex items-center gap-2 font-mono text-right shrink-0">
                        <div className="text-[11px] text-zinc-400">
                          Sistema: <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.expectedStock}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Conteo: <span className="font-bold text-zinc-900 dark:text-white">{item.countedStock}</span>
                        </div>
                        <div
                          className={`text-xs font-black px-1.5 py-0.5 rounded-sm ${
                            !isDiscrepant
                              ? "text-zinc-400"
                              : item.discrepancy > 0
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                          }`}
                        >
                          {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                        </div>
                      </div>
                    </div>

                    {/* Estado de Resolución */}
                    {isDiscrepant && (
                      <div className="bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs">
                        {item.resolved ? (
                          <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                            <span className="font-bold uppercase text-zinc-400 mr-2">
                              Ajustado [{item.reason}]:
                            </span>
                            <span>{item.comments || "Sin comentarios"}</span>
                          </div>
                        ) : (
                          <form
                            action={resolveAuditItem as any}
                            className="space-y-2"
                          >
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="sucursalId" value={sucursalId} />

                            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold">
                              Requiere Conciliación:
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                name="reason"
                                required
                                defaultValue=""
                                className="h-9 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                              >
                                <option value="" disabled>
                                  Motivo de ajuste...
                                </option>
                                <option value="ROBO">Robo / Hurto</option>
                                <option value="MERMA">Merma / Daño</option>
                                <option value="ERROR_CONTEO">Error de conteo</option>
                                <option value="ERROR_SISTEMA">Error de captura</option>
                                <option value="OTRO">Otro motivo</option>
                              </select>

                              <input
                                type="text"
                                name="comments"
                                placeholder="Nota opcional..."
                                className="h-9 px-2.5 flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                              />

                              <button
                                type="submit"
                                className="h-9 px-3 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-lg font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0"
                              >
                                Ajustar
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
