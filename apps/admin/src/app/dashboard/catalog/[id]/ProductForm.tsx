"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertProduct } from "../actions";
import { PrintLabelsModal, PrintProduct } from "../_components/PrintLabelsModal";

interface ProductFormProps {
  initialData?: {
    id: string;
    nombre: string;
    codigo_interno: string | null;
    precio_publico: number;
    costo: number;
    precio_mayoreo?: number | null;
    min_cantidad_mayoreo?: number | null;
    variants?: Array<{
      id: string;
      variante_nombre: string;
      codigo_interno: string | null;
      isActive: boolean;
    }>;
  };
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [variants, setVariants] = useState<Array<{ id?: string; variante_nombre: string; codigo_interno: string | null }>>(
    initialData?.variants || []
  );

  const addVariant = () => {
    setVariants([...variants, { variante_nombre: "", codigo_interno: "" }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, key: string, value: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [key]: value };
    setVariants(updated);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await upsertProduct(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/catalog");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm animate-in fade-in duration-300">
      <div className="border-b border-gray-200 dark:border-zinc-800 pb-4 mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          {initialData ? "Editar Producto" : "Nuevo Producto"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Los cambios se sincronizarán con los puntos de venta.
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}

      <input type="hidden" name="id" value={initialData?.id || "new"} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
            SKU (Código Interno)
          </label>
          <input
            name="codigo_interno"
            type="text"
            defaultValue={initialData?.codigo_interno || ""}
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
            placeholder="Ej: PROD-123"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
            Nombre del Producto <span className="text-red-500">*</span>
          </label>
          <input
            name="nombre"
            type="text"
            required
            defaultValue={initialData?.nombre}
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
            placeholder="Galletas de Chocolate"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
            Precio Público ($) <span className="text-red-500">*</span>
          </label>
          <input
            name="precio_publico"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={initialData?.precio_publico}
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 font-mono"
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
            Costo ($) <span className="text-red-500">*</span>
          </label>
          <input
            name="costo"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={initialData?.costo}
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 font-mono"
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
            Precio Mayoreo / Oferta ($)
          </label>
          <input
            name="precio_mayoreo"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={initialData?.precio_mayoreo !== null ? initialData?.precio_mayoreo : ""}
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 font-mono"
            placeholder="0.00 (Opcional)"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300">
            Cantidad Mínima Mayoreo
          </label>
          <input
            name="min_cantidad_mayoreo"
            type="number"
            step="1"
            min="2"
            defaultValue={initialData?.min_cantidad_mayoreo !== null ? initialData?.min_cantidad_mayoreo : ""}
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 font-mono"
            placeholder="Ej: 3 (Opcional)"
          />
        </div>
      </div>

      {/* Control de Variantes */}
      <div className="border-t border-gray-200 dark:border-zinc-800 pt-6 mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Variantes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Define variantes (ej. colores, formas, tallas). Compartirán precio, costo y reglas de mayoreo.
            </p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-black px-4 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-gray-100 transition-colors"
          >
            + Agregar Variante
          </button>
        </div>

        {variants.length > 0 && (
          <div className="space-y-3">
            {variants.map((v, index) => (
              <div key={index} className="flex gap-4 items-center animate-in fade-in duration-200">
                <input type="hidden" value={v.id || ""} />
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder="Nombre (ej: Rojo, Café, Grande)"
                    value={v.variante_nombre}
                    onChange={(e) => updateVariant(index, "variante_nombre", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Código Interno / Código Barras"
                    value={v.codigo_interno || ""}
                    onChange={(e) => updateVariant(index, "codigo_interno", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg hover:border-red-100 dark:hover:border-red-900 border border-transparent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2050/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      </div>

      <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-zinc-800 mt-6">
        {initialData && (
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="mr-auto h-10 px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900/50 dark:text-gray-100 flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Imprimir Código QR
          </button>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 px-4 py-2 rounded-md border border-gray-200 bg-white dark:bg-black text-sm font-medium hover:bg-gray-100 hover:text-gray-900 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-gray-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          Guardar Producto
        </button>
      </div>

      {initialData && (
        <PrintLabelsModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          product={initialData as PrintProduct}
        />
      )}
    </form>
  );
}
