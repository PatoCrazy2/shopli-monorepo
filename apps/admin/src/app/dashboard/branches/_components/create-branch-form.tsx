"use client";

import { useState } from "react";
import { createSucursal } from "../actions";

export function CreateBranchForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await createSucursal(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        form.reset();
      }
    } catch (err: any) {
      setError(err?.message || "Error al crear la sucursal");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm sticky top-24">
      <h2 className="text-lg font-bold mb-4">Nueva Sucursal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-semibold animate-in fade-in flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="nombre" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">
            Nombre Comercial
          </label>
          <input
            type="text"
            name="nombre"
            id="nombre"
            required
            disabled={isPending}
            className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black placeholder:text-zinc-300 transition-all disabled:opacity-50"
            placeholder="Ej: ShopLI Central"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="direccion" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">
            Ubicación
          </label>
          <input
            type="text"
            name="direccion"
            id="direccion"
            disabled={isPending}
            className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black placeholder:text-zinc-300 transition-all disabled:opacity-50"
            placeholder="Calle, Ciudad, Estado"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-black text-white rounded-lg font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        >
          {isPending ? "Procesando..." : "Abrir Punto de Venta"}
        </button>
      </form>
    </div>
  );
}
