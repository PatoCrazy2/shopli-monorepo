"use client";

import { useState } from "react";
import { fetchSaleDetails } from "../actions";

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
      setError("No se pudieron cargar los detalles.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = e.currentTarget.open;
    if (isOpen && !details && !loading) {
      loadDetails();
    }
  };

  return (
    <details
      className="group transition-colors list-none"
      onToggle={handleToggle}
    >
      <summary className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-900/40 transition-colors [&::-webkit-details-marker]:hidden gap-4">
        <div className="flex flex-1 items-center gap-6 flex-wrap">
          <div className="w-full sm:w-48 text-sm font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
            {formattedDate}
          </div>

          <div className="flex items-center gap-2.5 min-w-[200px]">
            <span className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs font-bold uppercase ring-1 ring-zinc-200 dark:ring-zinc-700">
              {(venta.usuarioName || "U")[0]}
            </span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {venta.usuarioName || "Desconocido"}
            </span>
          </div>

          <div className="text-zinc-500 text-sm flex items-center gap-2">
            <span className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full text-xs font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-mono">
              {venta.itemsCount} ITEMS
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t border-zinc-100 dark:border-zinc-800 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
          <span
            className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
              venta.estado === "COMPLETADA"
                ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                : "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400"
            }`}
          >
            {venta.estado}
          </span>

          <div className="flex items-center gap-4">
            <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100 min-w-[80px] text-right font-mono tabular-nums">
              ${venta.total.toFixed(2)}
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-500 dark:text-zinc-400 group-open:rotate-180 transition-transform"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </summary>

      {/* Contenido expandible usando details */}
      <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800 text-sm shadow-inner group-open:animate-in group-open:fade-in group-open:slide-in-from-top-2">
        {loading && (
          <div className="py-8 flex items-center justify-center gap-3 text-zinc-500 text-xs">
            <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-200 rounded-full animate-spin" />
            <span>Cargando productos de la venta...</span>
          </div>
        )}

        {error && (
          <div className="py-4 text-center text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
            <button
              onClick={loadDetails}
              className="ml-2 underline font-semibold text-zinc-900 dark:text-zinc-100 hover:text-rose-600"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && details && details.length === 0 && (
          <div className="py-6 text-center text-xs text-zinc-500">
            Esta venta no tiene productos registrados.
          </div>
        )}

        {!loading && !error && details && details.length > 0 && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/60 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2.5 px-4 w-1/2">Producto</th>
                  <th className="py-2.5 px-4 text-center">Cant.</th>
                  <th className="py-2.5 px-4 text-right">Precio unitario</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {details.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                      {d.nombre}
                    </td>
                    <td className="py-2.5 px-4 text-center text-zinc-600 dark:text-zinc-400 font-mono">
                      x{d.cantidad}
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-600 dark:text-zinc-400 font-mono tabular-nums">
                      ${d.precioUnitario.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                      ${d.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex justify-end px-2">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wider uppercase">
            Venta ID: {venta.id}
          </span>
        </div>
      </div>
    </details>
  );
}
