import { DollarSign, TrendingUp, ReceiptText } from "lucide-react";
import { getKPIData } from "../queries";

/**
 * Async Server Component — renderiza los 3 KPIs consolidados en un bloque tipo Bento.
 * Móvil: Ventas ocupa el ancho completo superior, Ganancias y Tickets se dividen abajo.
 * Desktop: 3 columnas simétricas con divisores limpios de 1px.
 */
export async function KPICards() {
  const { ventasHoy, gananciaHoy, ticketsTotales } = await getKPIData();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs">
      {/* 1. Ventas Hoy: Principal en móvil (col-span-2) */}
      <div className="col-span-2 md:col-span-1 bg-white dark:bg-zinc-950 p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
            Ventas Hoy
          </span>
          <DollarSign className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
            ${ventasHoy.toFixed(2)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Ventas completadas del día
          </p>
        </div>
      </div>

      {/* 2. Ganancias Hoy */}
      <div className="col-span-1 bg-white dark:bg-zinc-950 p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
            Ganancias
          </span>
          <TrendingUp className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
            ${gananciaHoy.toFixed(2)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Margen bruto hoy
          </p>
        </div>
      </div>

      {/* 3. Tickets Totales */}
      <div className="col-span-1 bg-white dark:bg-zinc-950 p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
            Tickets
          </span>
          <ReceiptText className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
            +{ticketsTotales}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Operaciones generadas
          </p>
        </div>
      </div>
    </div>
  );
}
