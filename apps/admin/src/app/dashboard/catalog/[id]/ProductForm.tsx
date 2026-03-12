"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertProduct } from "../actions";

interface ProductFormProps {
  initialData?: {
    id: string;
    nombre: string;
    codigo_interno: string | null;
    precio_publico: number;
    costo: number;
    stock: number;
  };
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
            {initialData ? "Stock Actual" : "Stock Inicial"}
          </label>
          <input
            name="stock"
            type="number"
            step="1"
            defaultValue={initialData?.stock ?? 0}
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 font-mono"
            placeholder="0"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-zinc-800 mt-6">
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
    </form>
  );
}
