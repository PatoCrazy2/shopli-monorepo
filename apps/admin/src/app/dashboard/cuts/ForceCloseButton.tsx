"use client";

import { forceCloseTurno } from "./actions";
import { useState, useTransition } from "react";

export default function ForceCloseButton({ turnoId }: { turnoId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleForceClose = () => {
    if (!confirm("¿Estás seguro de forzar el cierre administrativo de este turno?")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await forceCloseTurno(turnoId);
      if (res?.error) {
        setError(res.error);
        alert(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleForceClose}
        disabled={isPending}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isPending ? "Cerrando..." : "Cierre Administrativo"}
      </button>
      {error && <span className="text-[10px] text-red-500 font-bold">{error}</span>}
    </div>
  );
}
