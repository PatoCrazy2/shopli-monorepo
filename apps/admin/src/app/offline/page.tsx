import Image from "next/image";
import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión | ShopLI Admin",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-black selection:text-white">
      <div className="w-full max-w-xs flex flex-col items-center text-center gap-6 animate-in fade-in duration-200">
        {/* Contenedor del ícono y badge */}
        <div className="relative w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-xs">
          <Image
            src="/shopli_snbg.svg"
            alt="ShopLI"
            width={36}
            height={36}
            className="w-9 h-9 object-contain opacity-40 grayscale"
            priority
          />
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
            <WifiOff className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>

        {/* Textos */}
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight">Sin conexión</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Comprueba tu red o intenta recargar para acceder a esta sección.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2.5 w-full pt-1">
          <Link
            href="/dashboard/inicio"
            className="w-full h-10 px-4 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </Link>
          <Link
            href="/dashboard/inicio"
            className="w-full h-10 px-4 flex items-center justify-center text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 active:scale-95 transition-all"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
