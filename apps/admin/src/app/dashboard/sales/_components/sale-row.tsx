"use client";

import { useState, useEffect } from "react";
import { fetchSaleDetails } from "../actions";
import { ChevronRight, X, Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

export interface SaleRowData {
  id: string;
  fecha: Date;
  estado: string;
  total: number;
  itemsCount: number;
  usuarioName: string;
}

interface SaleDetailItem {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export function SaleRow({
  venta,
  formattedDate,
}: {
  venta: SaleRowData;
  formattedDate: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<SaleDetailItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSaleDetails(venta.id);
      setDetails(data);
    } catch (err) {
      console.error("[SaleRow] Error cargando detalles:", err);
      setError("No se pudieron cargar los productos de la venta.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!details && !loading) {
      loadDetails();
    }
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isCompleted = venta.estado === "COMPLETADA";

  const renderContent = () => (
    <>
      {/* Estado de Carga */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          <span>Cargando productos del ticket...</span>
        </div>
      )}

      {/* Estado de Error */}
      {error && (
        <div className="py-8 text-center text-xs text-rose-600 dark:text-rose-400 font-medium">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadDetails}
            className="mt-2 inline-flex items-center px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-200"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lista Vacía */}
      {!loading && !error && details && details.length === 0 && (
        <div className="py-8 text-center text-xs text-zinc-400">
          Esta venta no tiene productos registrados.
        </div>
      )}

      {/* Tabla de Productos */}
      {!loading && !error && details && details.length > 0 && (
        <div className="overflow-y-auto max-h-[50vh] pr-1">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="pb-2">Producto</th>
                <th className="pb-2 text-center">Cant.</th>
                <th className="pb-2 text-right">P. Unit</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs">
              {details.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                  <td className="py-2.5 pr-2 font-medium text-zinc-800 dark:text-zinc-200">
                    {d.nombre}
                  </td>
                  <td className="py-2.5 px-2 text-center text-zinc-500 dark:text-zinc-400 font-mono">
                    x{d.cantidad}
                  </td>
                  <td className="py-2.5 px-2 text-right text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                    ${d.precioUnitario.toFixed(2)}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                    ${d.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Fila / Card de Venta Interactiva */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-900/40 transition-colors gap-3 select-none text-left"
      >
        <div className="flex flex-1 items-center gap-4 sm:gap-6 flex-wrap">
          <div className="w-full sm:w-44 text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
            {formattedDate}
          </div>

          <div className="flex items-center gap-2 min-w-[160px]">
            <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-bold uppercase ring-1 ring-zinc-200 dark:ring-zinc-700">
              {(venta.usuarioName || "U")[0]}
            </span>
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {venta.usuarioName || "Desconocido"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-zinc-100 dark:bg-zinc-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-mono">
              {venta.itemsCount} ITEMS
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full border-t border-zinc-100 dark:border-zinc-800 sm:border-0 pt-2 sm:pt-0">
          <span
            className={cn(
              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
              isCompleted
                ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                : "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400"
            )}
          >
            {venta.estado}
          </span>

          <div className="flex items-center gap-3">
            <span className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 min-w-[70px] text-right font-mono tabular-nums">
              ${venta.total.toFixed(2)}
            </span>
            <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
              <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet / Modal Container */}
          <div
            className={cn(
              "relative z-50 bg-white dark:bg-zinc-950 border-t md:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col w-full max-h-[85vh]",
              // Mobile: Bottom Sheet
              "rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] animate-in slide-in-from-bottom duration-200",
              // Desktop: Centered Dialog
              "md:rounded-2xl md:max-w-lg md:p-6 md:animate-in md:zoom-in-95 md:duration-150"
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Mobile Drag Indicator */}
            <div className="md:hidden w-10 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-3" />

            {/* Header del Ticket */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={14} className="text-zinc-500" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-tight">
                    Ticket de Venta
                  </h3>
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border",
                      isCompleted
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                        : "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400"
                    )}
                  >
                    {venta.estado}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {formattedDate} · Staff: {venta.usuarioName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors"
                aria-label="Cerrar ticket"
              >
                <X size={15} />
              </button>
            </div>

            {/* Contenido (Tabla de Productos) */}
            <div className="my-4 flex-1 overflow-hidden">
              {renderContent()}
            </div>

            {/* Footer con Total y Cierre */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Venta</span>
                <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-mono tabular-nums">
                  ${venta.total.toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl font-bold text-xs transition-colors"
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
