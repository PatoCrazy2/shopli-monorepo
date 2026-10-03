"use client";

import { useState } from "react";
import { X, ChevronRight, Loader2 } from "lucide-react";
import { resolveAuditItem, getAuditFullDetails } from "./actions";

export interface AuditItem {
  id: string;
  discrepancy: number;
  resolved: boolean;
  expectedStock?: number;
  countedStock?: number;
  reason?: string | null;
  comments?: string | null;
  producto?: {
    nombre: string;
    codigo_interno: string | null;
  };
}

export interface Auditoria {
  id: string;
  items: AuditItem[];
}

interface AuditDetailsDrawerProps {
  auditorias: Auditoria[];
  sucursalId: string;
  turnoId?: string;
}

export default function AuditDetailsDrawer({
  auditorias,
  sucursalId,
  turnoId,
}: AuditDetailsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fullAuditorias, setFullAuditorias] = useState<Auditoria[] | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (!auditorias || auditorias.length === 0) {
    return null;
  }

  // Items para la insignia del botón (resumen ligero inicial)
  const initialItems = auditorias.flatMap((a) => a.items);
  const initialDiscrepant = initialItems.filter((i) => i.discrepancy !== 0);
  const initialPending = initialDiscrepant.filter((i) => !i.resolved);
  const hasDiscrepancy = initialDiscrepant.length > 0;

  // Items activos para renderizar dentro del Drawer
  const activeAuditorias = fullAuditorias ?? auditorias;
  const activeItems = activeAuditorias.flatMap((a) => a.items);
  const activeDiscrepant = activeItems.filter((i) => i.discrepancy !== 0);

  const loadDetails = async () => {
    if (!turnoId) return;
    setIsLoadingDetails(true);
    setFetchError(null);
    try {
      const data = await getAuditFullDetails(turnoId);
      setFullAuditorias(data as Auditoria[]);
    } catch (err) {
      console.error("[AuditDetailsDrawer] Error cargando detalles:", err);
      setFetchError("No se pudieron cargar los productos de la auditoría.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && !fullAuditorias && turnoId) {
      loadDetails();
    }
  };

  // Lista reutilizable de productos para Móvil y Desktop
  const renderAuditList = () => (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-900 my-1 pr-1 space-y-2">
      {activeItems.map((item) => {
        const isDiscrepant = item.discrepancy !== 0;
        return (
          <div key={item.id} className="pt-2.5 pb-2 space-y-2">
            {/* Fila del Producto */}
            <div className="flex items-start justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {item.producto?.nombre ?? "Producto"}
                </span>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  SKU: {item.producto?.codigo_interno || "N/A"}
                </div>
              </div>

              {/* Métricas: Sistema vs Conteo */}
              <div className="flex items-center gap-2 font-mono text-right shrink-0">
                <div className="text-[11px] text-zinc-400">
                  Sistema:{" "}
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">
                    {item.expectedStock ?? 0}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Conteo:{" "}
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {item.countedStock ?? 0}
                  </span>
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
                  <form action={resolveAuditItem as any} className="space-y-2">
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
                        className="h-9 px-3 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-lg font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
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
  );

  const renderAuditBody = () => {
    if (isLoadingDetails) {
      return (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          <span className="font-mono">Cargando productos de la auditoría...</span>
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="py-8 text-center text-xs text-rose-600 dark:text-rose-400 font-medium">
          <p>{fetchError}</p>
          <button
            type="button"
            onClick={loadDetails}
            className="mt-2 inline-flex items-center px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-200 transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (activeItems.length === 0) {
      return (
        <div className="py-8 text-center text-xs text-zinc-400 font-mono">
          Esta auditoría no tiene productos registrados.
        </div>
      );
    }

    return renderAuditList();
  };

  return (
    <>
      {/* Botón disparador: Toggle en Desktop y Disparador de Bottom Sheet en Mobile */}
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors group cursor-pointer text-left select-none"
        aria-expanded={isOpen}
        aria-label="Ver auditoría de inventario a ciegas"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            !hasDiscrepancy
              ? "bg-zinc-400 dark:bg-zinc-600"
              : initialPending.length > 0
              ? "bg-amber-600 dark:bg-amber-500 animate-pulse"
              : "bg-zinc-900 dark:bg-zinc-100"
          }`}
        />
        <span className="text-zinc-500 dark:text-zinc-400">Inventario:</span>
        <span
          className={`font-semibold ${
            !hasDiscrepancy
              ? "text-zinc-700 dark:text-zinc-300"
              : initialPending.length > 0
              ? "text-amber-800 dark:text-amber-300 font-bold"
              : "text-zinc-900 dark:text-zinc-100 font-medium"
          }`}
        >
          {!hasDiscrepancy
            ? "Conforme"
            : `${initialDiscrepant.length} con diferencia (${initialPending.length} pendientes)`}
        </span>
        <ChevronRight
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-90" : "group-hover:translate-x-0.5"
          }`}
        />
      </button>

      {/* 1. VISTA DESKTOP: Despliegue inline bajo el botón (acordeón integrado) */}
      {isOpen && (
        <div className="hidden md:block w-full mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Auditoría de Inventario a Ciegas • {activeItems.length} verificados ({activeDiscrepant.length} discrepancias)
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              [Cerrar]
            </button>
          </div>
          {renderAuditBody()}
        </div>
      )}

      {/* 2. VISTA MÓVIL: Bottom Sheet Drawer deslizable */}
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
                  {activeItems.length} productos verificados • {activeDiscrepant.length} discrepancias
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

            {/* Lista detallada con scroll */}
            <div className="overflow-y-auto my-2 pr-1">
              {renderAuditBody()}
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
