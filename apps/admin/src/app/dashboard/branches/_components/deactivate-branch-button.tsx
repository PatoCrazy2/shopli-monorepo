"use client";

import { deleteSucursal } from "../actions";

interface DeactivateBranchButtonProps {
  id: string;
  nombre: string;
}

export function DeactivateBranchButton({ id, nombre }: DeactivateBranchButtonProps) {
  return (
    <form action={deleteSucursal.bind(null, id)}>
      <button
        type="submit"
        className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-transparent hover:border-amber-100 group"
        title="Desactivar punto de venta"
        onClick={(e) => {
          if (!confirm(`¿Estás seguro de desactivar la sucursal "${nombre}"? No podrá operar nuevas ventas pero se mantendrá su historial.`)) {
            e.preventDefault();
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
            <path d="M9 9h6v6H9z"></path>
        </svg>
        Desactivar
      </button>
    </form>
  );
}
