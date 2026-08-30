"use client";

import { useState, useMemo } from "react";
import { generateLabelsPDF, LabelProductInput } from "@/lib/label-generator";

export interface CatalogProduct {
  id: string;
  nombre: string;
  codigo_interno: string | null;
  precio_publico: number;
  variants: Array<{
    id: string;
    variante_nombre: string;
    codigo_interno: string | null;
  }>;
}

interface PrintLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: CatalogProduct[];
}

export function PrintLabelsModal({ isOpen, onClose, products }: PrintLabelsModalProps) {
  const [format, setFormat] = useState<"letter" | "thermal">("letter");
  const [searchQuery, setSearchQuery] = useState("");

  // Estado de ids seleccionados (tanto padres como variantes)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    products.forEach((p) => {
      ids.add(p.id);
      p.variants.forEach((v) => ids.add(v.id));
    });
    return ids;
  });

  // Estado de cantidades por ID
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const qtys: Record<string, number> = {};
    products.forEach((p) => {
      qtys[p.id] = 1;
      p.variants.forEach((v) => {
        qtys[v.id] = 1;
      });
    });
    return qtys;
  });

  // Filtrado de productos en memoria
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return products;

    return products.filter((p) => {
      const matchParent = p.nombre.toLowerCase().includes(query) || 
                          (p.codigo_interno && p.codigo_interno.toLowerCase().includes(query));
      
      const matchVariant = p.variants.some((v) => 
        v.variante_nombre.toLowerCase().includes(query) || 
        (v.codigo_interno && v.codigo_interno.toLowerCase().includes(query))
      );

      return matchParent || matchVariant;
    });
  }, [products, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleQtyChange = (id: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, val),
    }));
  };

  const selectAll = () => {
    const next = new Set<string>();
    products.forEach((p) => {
      next.add(p.id);
      p.variants.forEach((v) => next.add(v.id));
    });
    setSelectedIds(next);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handlePrint = async () => {
    const productsToPrint: LabelProductInput[] = [];

    products.forEach((p) => {
      // 1. Producto principal
      if (selectedIds.has(p.id) && (quantities[p.id] || 0) > 0) {
        productsToPrint.push({
          nombre: p.nombre,
          variante_nombre: null,
          precio_publico: p.precio_publico,
          codigo_interno: p.codigo_interno || "SIN-SKU",
          cantidad: quantities[p.id] || 0,
        });
      }

      // 2. Variantes
      p.variants.forEach((v) => {
        if (selectedIds.has(v.id) && (quantities[v.id] || 0) > 0) {
          productsToPrint.push({
            nombre: p.nombre,
            variante_nombre: v.variante_nombre,
            precio_publico: p.precio_publico,
            codigo_interno: v.codigo_interno || "SIN-SKU",
            cantidad: quantities[v.id] || 0,
          });
        }
      });
    });

    if (productsToPrint.length === 0) {
      alert("Por favor, selecciona al menos 1 producto con cantidad mayor a 0.");
      return;
    }

    try {
      const doc = await generateLabelsPDF(productsToPrint, format);
      doc.save(`etiquetas-catalogo-${format}.pdf`);
      onClose();
    } catch (err) {
      console.error("Error generando PDF de catálogo:", err);
      alert("Error al compilar el PDF de etiquetas.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Impresión de Etiquetas</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Selecciona los productos y define el formato para exportar sus códigos QR.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Formato de Papel */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Formato de Impresión</h4>
            <div className="grid grid-cols-2 gap-4">
              
              <button
                type="button"
                onClick={() => setFormat("letter")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  format === "letter"
                    ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-900/50 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-zinc-500"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="8" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="16" y2="14" />
                </svg>
                <span className="text-xs text-zinc-900 dark:text-zinc-100 font-bold block">Planilla Carta</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Avery 3x10 (30 etiquetas)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("thermal")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  format === "thermal"
                    ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-900/50 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-zinc-500"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" rx="1" />
                  <path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
                </svg>
                <span className="text-xs text-zinc-900 dark:text-zinc-100 font-bold block">Impresora Térmica</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Rollo 50mm x 25mm</span>
              </button>

            </div>
          </div>

          {/* Buscador y Selección Rápida */}
          <div className="space-y-3">
            <div className="flex justify-between items-center gap-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Selección de Productos</h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:underline"
                >
                  Seleccionar Todos
                </button>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:underline"
                >
                  Limpiar Selección
                </button>
              </div>
            </div>

            {/* Input de Búsqueda */}
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            {/* Lista Scrollable */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-[300px] overflow-y-auto bg-zinc-50/10 divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  No se encontraron productos coincidentes.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const parentChecked = selectedIds.has(p.id);
                  
                  return (
                    <div key={p.id} className="p-3 space-y-2 bg-white dark:bg-zinc-950/20">
                      
                      {/* Fila del Producto Padre */}
                      <div className="flex items-center justify-between gap-4">
                        <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={parentChecked}
                            onChange={() => toggleSelect(p.id)}
                            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-transparent accent-black dark:accent-white focus:ring-0 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                              {p.nombre}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                              SKU: {p.codigo_interno || "N/A"}
                            </span>
                          </div>
                        </label>
                        {parentChecked && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-400">Copias:</span>
                            <input
                              type="number"
                              min="1"
                              value={quantities[p.id] || 1}
                              onChange={(e) => handleQtyChange(p.id, parseInt(e.target.value) || 0)}
                              className="w-12 h-7 text-center rounded border border-zinc-300 dark:border-zinc-700 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                            />
                          </div>
                        )}
                      </div>

                      {/* Filas de Variantes (Anidadas) */}
                      {p.variants && p.variants.length > 0 && (
                        <div className="pl-7 space-y-2 border-l border-zinc-100 dark:border-zinc-900 mt-1">
                          {p.variants.map((v) => {
                            const varChecked = selectedIds.has(v.id);
                            
                            return (
                              <div key={v.id} className="flex items-center justify-between gap-4 py-1">
                                <label className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={varChecked}
                                    onChange={() => toggleSelect(v.id)}
                                    className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700 bg-transparent accent-black dark:accent-white focus:ring-0 cursor-pointer"
                                  />
                                  <div className="min-w-0">
                                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate block">
                                      {v.variante_nombre}
                                    </span>
                                    <span className="text-[9px] text-zinc-400 font-mono block">
                                      SKU: {v.codigo_interno || "N/A"}
                                    </span>
                                  </div>
                                </label>
                                {varChecked && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-zinc-400">Copias:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      value={quantities[v.id] || 1}
                                      onChange={(e) => handleQtyChange(v.id, parseInt(e.target.value) || 0)}
                                      className="w-10 h-6 text-center rounded border border-zinc-300 dark:border-zinc-700 bg-transparent text-[11px] focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="h-10 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-md transition-colors"
          >
            Generar y Descargar PDF
          </button>
        </div>

      </div>
    </div>
  );
}
