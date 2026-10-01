import { getKPIData } from "../queries";

/**
 * Async Server Component — renderiza los KPIs con diseño moderno fintech (Estilo Nu).
 * Ventas de hoy domina la parte superior sin caja, y los datos secundarios van en tarjetas limpias.
 */
export async function KPICards() {
  const { ventasHoy, gananciaHoy, ticketsTotales } = await getKPIData();

  // Formatear la fecha actual en zona horaria local (México)
  const now = new Date();
  const dayFormatter = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "2-digit" });
  const monthFormatter = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", month: "short" });
  
  const currentDay = dayFormatter.format(now);
  const currentMonth = monthFormatter.format(now).toUpperCase(); // ej. OCT

  return (
    <div className="space-y-6 md:space-y-8 pt-2">
      {/* Dato Principal: Premium Black Card con Widget de Calendario */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-zinc-800">
        {/* Glow sutil de fondo */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="flex items-stretch justify-between relative z-10 gap-4">
          <div className="flex flex-col justify-between">
            <h2 className="text-[13px] md:text-sm font-medium text-zinc-400 leading-none">
              Ventas de hoy
            </h2>
            <div className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-none mt-2 md:mt-3">
              ${ventasHoy.toFixed(2)}
            </div>
          </div>

          {/* Widget de Calendario físico con hojas apiladas */}
          <div className="relative w-16 h-20 md:w-20 md:h-24 self-center shrink-0 mb-1">
            {/* Hoja 3 (trasera) */}
            <div className="absolute inset-0 translate-y-2.5 scale-[0.88] bg-white/[0.04] border border-white/10 rounded-2xl pointer-events-none" />
            {/* Hoja 2 (intermedia) */}
            <div className="absolute inset-0 translate-y-1.5 scale-[0.94] bg-white/[0.08] border border-white/15 rounded-2xl pointer-events-none" />

            {/* Hoja principal frontal - sólida sin backdrop-filter para evitar desfasamiento en scroll */}
            <div className="relative h-full w-full flex flex-col items-center justify-center bg-zinc-900 border border-white/20 rounded-2xl py-2 px-1 shadow-lg">
              {/* Espiral delgada (alambres metálicos) */}
              <div className="absolute -top-1.5 inset-x-0 flex justify-center gap-1.5 md:gap-2 pointer-events-none z-10">
                <span className="w-[2px] h-3 bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 rounded-full shadow-xs" />
                <span className="w-[2px] h-3 bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 rounded-full shadow-xs" />
                <span className="w-[2px] h-3 bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 rounded-full shadow-xs" />
                <span className="w-[2px] h-3 bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 rounded-full shadow-xs" />
              </div>

              <span className="text-[9px] md:text-[10px] font-light tracking-[0.25em] text-zinc-400 uppercase leading-none mt-1">
                {currentMonth}
              </span>
              <span className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-none mt-1.5">
                {currentDay}
              </span>
            </div>
          </div>
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
