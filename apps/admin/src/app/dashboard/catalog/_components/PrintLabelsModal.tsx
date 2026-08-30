"use client";

import { useState } from "react";
import { generateLabelsPDF, LabelProductInput } from "@/lib/label-generator";

export interface PrintProduct {
  id: string;
  nombre: string;
  codigo_interno: string | null;
  precio_publico: number;
  variants?: Array<{
    id: string;
    variante_nombre: string;
    codigo_interno: string | null;
  }>;
}

interface PrintLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: PrintProduct;
}

export function PrintLabelsModal({ isOpen, onClose, product }: PrintLabelsModalProps) {
  const [format, setFormat] = useState<"letter" | "thermal">("letter");
  
  // Guardamos las cantidades para el producto principal y las variantes
  const [parentQty, setParentQty] = useState<number>(1);
  const [variantQtys, setVariantQtys] = useState<Record<string, number>>(
    product.variants?.reduce((acc, v) => ({ ...acc, [v.id]: 1 }), {}) || {}
  );

  if (!isOpen) return null;

  const handleVariantQtyChange = (id: string, qty: number) => {
    setVariantQtys((prev) => ({
      ...prev,
      [id]: Math.max(0, qty),
    }));
  };

  const handlePrint = async () => {
    const productsToPrint: LabelProductInput[] = [];

    // 1. Añadir producto padre si tiene cantidad > 0
    if (parentQty > 0) {
      productsToPrint.push({
        nombre: product.nombre,
        variante_nombre: null,
        precio_publico: product.precio_publico,
        codigo_interno: product.codigo_interno || "SIN-SKU",
        cantidad: parentQty,
      });
    }

    // 2. Añadir variantes si tienen cantidad > 0
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        const qty = variantQtys[v.id] || 0;
        if (qty > 0) {
          productsToPrint.push({
            nombre: product.nombre,
            variante_nombre: v.variante_nombre,
            precio_publico: product.precio_publico,
            codigo_interno: v.codigo_interno || "SIN-SKU",
            cantidad: qty,
          });
        }
      });
    }

    if (productsToPrint.length === 0) {
      alert("Por favor, selecciona al menos 1 copia para imprimir.");
      return;
    }

    try {
      const doc = await generateLabelsPDF(productsToPrint, format);
      const fileName = `etiquetas-${product.nombre.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;
      doc.save(fileName);
      onClose();
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Ocurrió un error al generar las etiquetas.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/20">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Imprimir Etiquetas QR</h3>
            <p className="text-xs text-zinc-500 mt-1 truncate max-w-[320px]" title={product.nombre}>
              {product.nombre}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Formato de Papel */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Formato de Impresión</h4>
            <div className="grid grid-cols-2 gap-4">
              
              {/* Opción Carta */}
              <button
                type="button"
                onClick={() => setFormat("letter")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  format === "letter"
                    ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-900/50 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-zinc-500"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="8" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="16" y2="14" />
                </svg>
                <span className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold block">Planilla Carta</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">3x10 Avery (30 etiquetas)</span>
              </button>

              {/* Opción Térmico */}
              <button
                type="button"
                onClick={() => setFormat("thermal")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  format === "thermal"
                    ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-900/50 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-zinc-500"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" rx="1" />
                  <path d="M6 9V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
                </svg>
                <span className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold block">Impresora Térmica</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Rollo 50mm x 25mm</span>
              </button>

            </div>
          </div>

          {/* Cantidad por Producto / Variante */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Cantidad de etiquetas a generar</h4>
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-900 overflow-hidden bg-zinc-50/20">
              
              {/* Fila Producto Padre */}
              <div className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-zinc-950/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Producto Base</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Principal</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono block mt-0.5 truncate">
                    SKU: {product.codigo_interno || "Sin guardar (se generará)"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-zinc-400 font-medium">Copias:</label>
                  <input
                    type="number"
                    min="0"
                    value={parentQty}
                    onChange={(e) => setParentQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 h-8 text-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                  />
                </div>
              </div>

              {/* Filas Variantes */}
              {product.variants && product.variants.map((v) => (
                <div key={v.id} className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-zinc-950/20">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                      Variante: {v.variante_nombre}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono block mt-0.5 truncate">
                      SKU: {v.codigo_interno || "Sin guardar (se generará)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] text-zinc-400 font-medium">Copias:</label>
                    <input
                      type="number"
                      min="0"
                      value={variantQtys[v.id] || 0}
                      onChange={(e) => handleVariantQtyChange(v.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                    />
                  </div>
                </div>
              ))}

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
            Descargar PDF
          </button>
        </div>

      </div>
    </div>
  );
}
