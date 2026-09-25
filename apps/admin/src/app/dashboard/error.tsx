"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log del error para diagnóstico (sin exponer al usuario)
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        {/* Ícono de error */}
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200">
          <AlertTriangle className="w-8 h-8 text-zinc-500" />
        </div>

        {/* Texto principal */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Ocurrió un error inesperado
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            No se pudieron cargar los datos de esta sección. Puedes intentar
            de nuevo o regresar al inicio.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Ref: {error.digest}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>
          <a
            href="/dashboard/inicio"
            className="flex items-center justify-center flex-1 px-4 py-2.5 bg-white text-zinc-700 text-sm font-semibold rounded-xl border border-zinc-200 hover:bg-zinc-50 active:scale-95 transition-all duration-150"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
