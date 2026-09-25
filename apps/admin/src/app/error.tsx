"use client";

import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
          {/* Ícono */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200">
            <AlertTriangle className="w-7 h-7 text-zinc-500" />
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Algo salió mal
            </h1>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Ocurrió un error inesperado en la aplicación. Por favor intenta
              de nuevo.
            </p>
            {error.digest && (
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Ref: {error.digest}
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={reset}
              className="w-full px-4 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Intentar de nuevo
            </button>
            <a
              href="/"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white text-zinc-700 text-sm font-semibold rounded-xl border border-zinc-200 hover:bg-zinc-50 active:scale-95 transition-all duration-150"
            >
              <Home className="w-4 h-4" />
              Volver al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
