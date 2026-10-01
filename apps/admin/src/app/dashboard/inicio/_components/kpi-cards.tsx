import { getKPIData } from "../queries";

/**
 * Async Server Component — renderiza los KPIs con diseño moderno fintech (Estilo Nu).
 * Ventas de hoy domina la parte superior sin caja, y los datos secundarios van en tarjetas limpias.
 */
export async function KPICards() {
  const { ventasHoy, gananciaHoy, ticketsTotales } = await getKPIData();

  return (
    <div className="space-y-6 md:space-y-8 pt-2">
      {/* Dato Principal: Estilo Nu (Gigante, limpio, sin bordes) */}
      <div className="px-1 md:px-2">
        <h2 className="text-[13px] md:text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Ventas de hoy
        </h2>
        <div className="text-5xl md:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-white mt-1">
          ${ventasHoy.toFixed(2)}
        </div>
      </div>

      {/* Secundarios: Tarjetas suaves redondeadas */}
      <div className="grid grid-cols-2 gap-3 md:gap-5">
        <div className="bg-white dark:bg-zinc-950 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xs border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-center">
          <div className="text-[12px] md:text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Ganancia bruta
          </div>
          <div className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white">
            ${gananciaHoy.toFixed(2)}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xs border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-center">
          <div className="text-[12px] md:text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Tickets totales
          </div>
          <div className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-white">
            {ticketsTotales}
          </div>
        </div>
      </div>
    </div>
  );
}
