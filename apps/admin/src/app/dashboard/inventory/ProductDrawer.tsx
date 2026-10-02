"use client";

import { useEffect, useState } from "react";
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Clock, User, Building2, Package } from "lucide-react";
import { getProductKardex, type KardexItem } from "./history/queries";
import type { InventoryProductItem, BranchItem } from "./InventoryClient";

interface ProductDrawerProps {
  product: InventoryProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  selectedBranchId?: string;
  branches: BranchItem[];
}

export function ProductDrawer({
  product,
  isOpen,
  onClose,
  selectedBranchId,
  branches,
}: ProductDrawerProps) {
  const [movements, setMovements] = useState<KardexItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lazy loading del Kárdex solo cuando el Drawer se abre
  useEffect(() => {
    if (!isOpen || !product) {
      setMovements([]);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getProductKardex(product.id, selectedBranchId, 20)
      .then((data) => {
        if (isMounted) {
          setMovements(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error cargando Kárdex:", err);
          setError("No se pudo cargar el historial de movimientos.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, product, selectedBranchId]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const currentBranchName = selectedBranchId
    ? branches.find((b) => b.id === selectedBranchId)?.nombre
    : null;

  const MIN_STOCK = 5;
  const isNegative = product.totalStock < 0;
  const isLow = product.totalStock >= 0 && product.totalStock < MIN_STOCK;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Kárdex de Producto"
          className="w-screen max-w-md sm:max-w-lg bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del Drawer */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-900/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tabular-nums tracking-tight px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-300 dark:border-zinc-700">
                  {product.codigo_interno || "SIN SKU"}
                </span>
                {product.categoria && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 font-medium">
                    {product.categoria}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                {product.nombre}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar panel lateral"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Métricas Principales de Stock */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {currentBranchName
                    ? `Existencias en ${currentBranchName}`
                    : "Existencias Consolidadas"}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-mono tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
                    {product.totalStock}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">unidades</span>
                </div>
              </div>

              <div>
                {isNegative ? (
                  <span className="inline-flex px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    Stock Negativo
                  </span>
                ) : isLow ? (
                  <span className="inline-flex px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-300 dark:bg-zinc-850 dark:text-zinc-200 dark:border-zinc-700">
                    Reabastecer
                  </span>
                ) : (
                  <span className="inline-flex px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800">
                    Nivel Óptimo
                  </span>
                )}
              </div>
            </div>

            {/* Desglose de existencias por sucursal si se está en vista consolidada */}
            {!selectedBranchId && product.inventario.length > 0 && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Distribución por Sucursal
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {product.inventario.map((inv) => (
                    <div
                      key={inv.sucursal_id}
                      className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs"
                    >
                      <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">
                        {inv.sucursal.nombre}
                      </span>
                      <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-900 dark:text-zinc-100">
                        {inv.cantidad} u.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kárdex: Línea de Tiempo de Movimientos */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Kárdex de Movimientos (Últimos 20)
              </h3>
              {isLoading && (
                <span className="text-[11px] text-zinc-400 animate-pulse font-mono tabular-nums tracking-tight">
                  Consultando base de datos...
                </span>
              )}
            </div>

            {/* Estado de Carga */}
            {isLoading && (
              <div className="space-y-2.5 pt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 animate-pulse flex items-center justify-between"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-850 rounded" />
                    </div>
                    <div className="h-6 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-center text-xs text-zinc-600 dark:text-zinc-400">
                {error}
              </div>
            )}

            {/* Lista Vacía */}
            {!isLoading && !error && movements.length === 0 && (
              <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1">
                <Clock className="w-5 h-5 mx-auto text-zinc-400 mb-2" />
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Sin movimientos registrados
                </p>
                <p className="text-[11px] text-zinc-400">
                  Este producto aún no cuenta con historial de entradas o salidas en el sistema.
                </p>
              </div>
            )}

            {/* Lista de Movimientos */}
            {!isLoading && !error && movements.length > 0 && (
              <div className="space-y-2 pt-1">
                {movements.map((m) => {
                  const isPositive = m.cantidad > 0;
                  const isTransfer =
                    m.tipo === "TRANSFERENCIA_ENTRADA" ||
                    m.tipo === "TRANSFERENCIA_SALIDA";

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/70 transition-colors text-xs flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono tabular-nums tracking-tight font-bold text-xs ${
                              isPositive
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {isPositive ? `+${m.cantidad}` : m.cantidad} u.
                          </span>

                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {m.tipo.replace("_", " ")}
                          </span>
                        </div>

                        {/* Motivo */}
                        <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                          {m.motivo || "Sin motivo especificado"}
                        </p>

                        {/* Metadata: Usuario, Sucursal, Fecha */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 pt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3 text-zinc-400" />
                            {m.usuario?.name || "Sistema"}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-zinc-400" />
                            {m.sucursal.nombre}
                          </span>

                          <span className="inline-flex items-center gap-1 font-mono tabular-nums tracking-tight">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            {new Date(m.fecha).toLocaleString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer del Drawer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono tabular-nums tracking-tight">
              {movements.length} movimientos cargados
            </span>
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
            >
              Cerrar Panel
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
