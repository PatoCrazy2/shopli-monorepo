"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Search, ScanBarcode, X, History, ChevronRight } from "lucide-react";
import { BranchFilter } from "./BranchFilter";
import { QuickActions } from "./QuickActions";
import { ProductDrawer } from "./ProductDrawer";
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
  const [selectedProductForKardex, setSelectedProductForKardex] =
    useState<InventoryProductItem | null>(null);

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
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        {/* Buscador Centralizado */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, código de barras o SKU..."
            className="w-full h-10 pl-10 pr-9 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 shadow-xs transition-colors"
          />

          {searchQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Limpiar búsqueda"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Acciones: Escáner y Sucursal */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
            aria-label="Abrir escáner de código de barras"
          >
            <ScanBarcode className="w-4 h-4" />
            <span>Escanear</span>
          </button>

          <div className="flex-1 sm:flex-initial">
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

        {/* Botón Bitácora de Movimientos con presencia completa bajo Escáner y Sucursal */}
        <Link
          href="/dashboard/inventory/history"
          className="w-full inline-flex items-center justify-center gap-2 h-8 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-2xs cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-zinc-500" />
          <span>Bitácora de Movimientos</span>
        </Link>
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

      {/* 1. Vista Móvil: Cards Alargadas Táctiles (md:hidden) */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 shadow-xs">
            {isFiltering ? (
              <div className="space-y-3">
                <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                  No se encontraron productos coincidentes
                </p>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
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
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isNegative = p.totalStock < 0;
            const isLow = p.totalStock >= 0 && p.totalStock < MIN_STOCK;
            const branchStock = selectedBranchId
              ? p.inventario.find((inv) => inv.sucursal_id === selectedBranchId)?.cantidad ?? 0
              : null;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3 transition-colors"
              >
                {/* Zona superior: Clickeable para abrir Kárdex */}
                <div
                  onClick={() => setSelectedProductForKardex(p)}
                  className="cursor-pointer space-y-2 group"
                  title="Toca para ver el Kárdex de este producto"
                >
                  {/* Nombre y Estado */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-tight">
                        {p.nombre}
                      </h3>
                      <p className="font-mono tabular-nums tracking-tight text-[11px] text-zinc-400">
                        {p.codigo_interno ? `SKU: ${p.codigo_interno}` : "Sin SKU"}
                        {p.categoria ? ` • ${p.categoria}` : ""}
                      </p>
                    </div>

                    {/* Badge de Estado */}
                    <div className="shrink-0">
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
                    </div>
                  </div>

                  {/* Indicador visual de Kárdex / Historial */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <History className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
                      <span>Ver historial de movimientos</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* Fila de Métricas: Stock y Costo */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-850 text-xs">
                    <div>
                      <span className="text-zinc-400 text-[11px]">Stock Total: </span>
                      <span
                        className={`font-mono tabular-nums tracking-tight font-black text-sm ${
                          isNegative
                            ? "text-red-600 dark:text-red-400"
                            : isLow
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {p.totalStock} u.
                      </span>
                      {branchStock !== null && (
                        <span className="text-[11px] text-zinc-400 font-mono tabular-nums tracking-tight ml-1.5">
                          (Sucursal: <strong className="text-zinc-700 dark:text-zinc-300">{branchStock}</strong>)
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-zinc-400 text-[11px]">Costo: </span>
                      <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-700 dark:text-zinc-300">
                        ${Number(p.costo).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas Táctiles Protagonistas para Móvil */}
                <QuickActions
                  productId={p.id}
                  productName={p.nombre}
                  branches={branches}
                  selectedBranchId={selectedBranchId}
                  variant="card"
                  productShares={p.inventario.map((inv) => ({
                    sucursal_id: inv.sucursal_id,
                    cantidad: inv.cantidad,
                  }))}
                />
              </div>
            );
          })
        )}

        {filteredProducts.length > 0 && (
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 pt-1">
            Mostrando{" "}
            <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-700 dark:text-zinc-300">
              {filteredProducts.length}
            </span>
            {isFiltering ? ` de ${products.length}` : ""} productos
          </p>
        )}
      </div>

      {/* 2. Vista Desktop: Tabla Tradicional de Datos Monocromática (hidden md:block) */}
      <div className="hidden md:block bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
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
                      onClick={() => setSelectedProductForKardex(p)}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                      title="Haz clic para abrir el Kárdex detallado de este producto"
                    >
                      <td
                        className="px-4 py-3 font-mono tabular-nums tracking-tight text-zinc-500 dark:text-zinc-400 truncate max-w-[110px]"
                        title={p.codigo_interno || "N/A"}
                      >
                        {p.codigo_interno || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center justify-between gap-2">
                          <span className="group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                            {p.nombre}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-normal text-zinc-400 opacity-60 group-hover:opacity-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-all shrink-0">
                            <History className="w-3 h-3" />
                            <span className="hidden lg:inline">Historial</span>
                          </span>
                        </div>
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
                        <QuickActions
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

      {/* Panel Lateral / Drawer (Kárdex de Producto) */}
      <ProductDrawer
        product={selectedProductForKardex}
        isOpen={Boolean(selectedProductForKardex)}
        onClose={() => setSelectedProductForKardex(null)}
        selectedBranchId={selectedBranchId}
        branches={branches}
      />
    </div>
  );
}
