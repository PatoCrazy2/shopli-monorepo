"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, ScanBarcode, X } from "lucide-react";
import { BranchFilter } from "./BranchFilter";
import { QuickAdjustModal } from "./QuickAdjustModal";
import type { getInventory, getBranches } from "./queries";

const BarcodeScannerModal = dynamic(
  () =>
    import("../catalog/_components/BarcodeScannerModal").then(
      (mod) => mod.BarcodeScannerModal
    ),
  { ssr: false }
);

export type InventoryProductItem = Awaited<ReturnType<typeof getInventory>>[number];
export type BranchItem = Awaited<ReturnType<typeof getBranches>>[number];

interface InventoryClientProps {
  products: InventoryProductItem[];
  branches: BranchItem[];
  selectedBranchId?: string;
}

export function InventoryClient({
  products,
  branches,
  selectedBranchId,
}: InventoryClientProps) {
  const [filterPill, setFilterPill] = useState<"ALL" | "NEGATIVE" | "LOW_STOCK">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const MIN_STOCK = 5;

  // Conteo en memoria para píldoras rápidas
  const { negativeCount, lowStockCount } = useMemo(() => {
    let negative = 0;
    let low = 0;
    for (const p of products) {
      if (p.totalStock < 0) {
        negative++;
      } else if (p.totalStock < MIN_STOCK) {
        low++;
      }
    }
    return { negativeCount: negative, lowStockCount: low };
  }, [products]);

  // Filtrado reactivo en memoria (Zero-latency)
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      // 1. Filtro por píldora
      if (filterPill === "NEGATIVE" && p.totalStock >= 0) return false;
      if (filterPill === "LOW_STOCK" && (p.totalStock < 0 || p.totalStock >= MIN_STOCK)) return false;

      // 2. Filtro por término de búsqueda (nombre, SKU/código o categoría)
      if (!query) return true;

      const matchesName = p.nombre.toLowerCase().includes(query);
      const matchesSku = p.codigo_interno ? p.codigo_interno.toLowerCase().includes(query) : false;
      const matchesCategory = p.categoria ? p.categoria.toLowerCase().includes(query) : false;
      const matchesProvider = p.proveedor?.nombre ? p.proveedor.nombre.toLowerCase().includes(query) : false;

      return matchesName || matchesSku || matchesCategory || matchesProvider;
    });
  }, [products, searchQuery, filterPill]);

  const isFiltering = searchQuery.trim().length > 0 || filterPill !== "ALL";

  return (
    <div className="space-y-4">
      {/* Barra de Comandos y Filtros Rápidos */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Input Buscador Centralizado con Escáner */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, código de barras o SKU..."
              className="w-full h-10 pl-10 pr-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 shadow-xs transition-colors"
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  title="Limpiar búsqueda"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                title="Escanear código de barras físico o QR"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
                aria-label="Abrir escáner de código de barras"
              >
                <ScanBarcode className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filtro de Sucursal */}
          <div className="shrink-0">
            <BranchFilter branches={branches} />
          </div>
        </div>

        {/* Píldoras de Filtro (Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => setFilterPill("ALL")}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
              filterPill === "ALL"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <span>Todos</span>
            <span
              className={`font-mono tabular-nums tracking-tight text-[11px] px-1.5 py-0.2 rounded ${
                filterPill === "ALL"
                  ? "bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterPill("NEGATIVE")}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all ${
              filterPill === "NEGATIVE"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <span>Stock Negativo</span>
            {negativeCount > 0 && (
              <span
                className={`font-mono tabular-nums tracking-tight text-[11px] px-1.5 py-0.2 rounded font-semibold ${
                  filterPill === "NEGATIVE"
                    ? "bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {negativeCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterPill("LOW_STOCK")}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all ${
              filterPill === "LOW_STOCK"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <span>Reabastecer</span>
            {lowStockCount > 0 && (
              <span
                className={`font-mono tabular-nums tracking-tight text-[11px] px-1.5 py-0.2 rounded font-semibold ${
                  filterPill === "LOW_STOCK"
                    ? "bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {lowStockCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Escáner de Código de Barras */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(barcode) => {
          setSearchQuery(barcode);
          setIsScannerOpen(false);
        }}
        title="Escanear Código para Búsqueda en Inventario"
      />

      {/* Tabla de Datos Monocromática */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 w-28">Código</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-right">Costo Unit.</th>
                <th className="px-4 py-3 text-center w-24">Stock</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Valor Parcial</th>
                <th className="px-4 py-3 text-center w-28">Estado</th>
                <th className="px-4 py-3 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                    {isFiltering ? (
                      <div className="space-y-3">
                        <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                          No se encontraron productos coincidentes
                        </p>
                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                          No hay productos para el criterio de búsqueda o filtro seleccionado.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setFilterPill("ALL");
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors shadow-xs"
                        >
                          Limpiar búsqueda y filtros
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                          No hay productos
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Registra productos para visualizar su inventario aquí.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const valorParcial = p.totalStock > 0 ? p.totalStock * Number(p.costo) : 0;
                  const isNegative = p.totalStock < 0;
                  const isLow = p.totalStock >= 0 && p.totalStock < MIN_STOCK;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td
                        className="px-4 py-3 font-mono tabular-nums tracking-tight text-zinc-500 dark:text-zinc-400 truncate max-w-[110px]"
                        title={p.codigo_interno || "N/A"}
                      >
                        {p.codigo_interno || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {p.nombre}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
                        {p.categoria || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums tracking-tight text-zinc-600 dark:text-zinc-300">
                        ${Number(p.costo).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-mono tabular-nums tracking-tight font-semibold px-2 py-0.5 rounded text-xs ${
                            isNegative
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                              : isLow
                                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          {p.totalStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums tracking-tight font-medium text-zinc-900 dark:text-zinc-100 hidden sm:table-cell">
                        ${valorParcial.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isNegative ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                            Revisar
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-850 dark:text-zinc-300 dark:border-zinc-700">
                            Reabastecer
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800">
                            Óptimo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <QuickAdjustModal
                          productId={p.id}
                          productName={p.nombre}
                          branches={branches}
                          selectedBranchId={selectedBranchId}
                          productShares={p.inventario.map((inv) => ({
                            sucursal_id: inv.sucursal_id,
                            cantidad: inv.cantidad,
                          }))}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de la Tabla */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <p>
            Mostrando{" "}
            <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-700 dark:text-zinc-300">
              {filteredProducts.length}
            </span>
            {isFiltering && (
              <>
                {" "}
                de{" "}
                <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-700 dark:text-zinc-300">
                  {products.length}
                </span>
              </>
            )}{" "}
            productos en el sistema
          </p>
        </div>
      </div>
    </div>
  );
}
