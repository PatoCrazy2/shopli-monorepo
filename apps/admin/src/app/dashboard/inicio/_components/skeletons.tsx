/**
 * Skeletons del Dashboard de Inicio.
 * Animados con animate-pulse, mismas dimensiones que los componentes reales
 * para evitar saltos de layout (CLS = 0) cuando el contenido real aparece.
 */

export function KPISkeleton() {
  return (
    <div className="space-y-6 md:space-y-8 pt-2">
      {/* Dato Principal Skeleton (Premium Black Card) */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-3xl p-6 md:p-8 shadow-xl border border-zinc-800">
        <div className="flex items-stretch justify-between gap-4">
          <div className="flex flex-col justify-between">
            <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-800" />
            <div className="h-12 w-48 md:h-16 md:w-64 animate-pulse rounded-md bg-zinc-800 mt-2 md:mt-3" />
          </div>
          {/* Widget de Calendario Skeleton (Formato Cuadrado) */}
          <div className="w-18 h-18 md:w-22 md:h-22 animate-pulse rounded-2xl bg-zinc-800 self-center shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-5">
        <div className="bg-white dark:bg-zinc-950 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xs border border-zinc-100 dark:border-zinc-800/80 h-24 md:h-32 flex flex-col justify-center">
          <div className="h-3 w-20 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800 mb-2" />
          <div className="h-6 w-24 md:h-8 md:w-32 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="bg-white dark:bg-zinc-950 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xs border border-zinc-100 dark:border-zinc-800/80 h-24 md:h-32 flex flex-col justify-center">
          <div className="h-3 w-20 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800 mb-2" />
          <div className="h-6 w-16 md:h-8 md:w-20 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      {/* Skeleton para la gráfica de barras — ocupa 2/3 */}
      <div className="col-span-1 lg:col-span-2 rounded-2xl md:rounded-3xl border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 md:p-6 shadow-xs">
        <div className="space-y-1.5 mb-4">
          <div className="h-4 w-40 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-52 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
        </div>
        {/* Barras del chart con altura responsiva */}
        <div className="flex items-end gap-3 h-[170px] md:h-[260px] pt-4">
          {[65, 40, 80, 55, 90, 45, 70].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-2">
              <div
                className="w-full animate-pulse rounded-t-md bg-zinc-100 dark:bg-zinc-800"
                style={{ height: `${height}%` }}
              />
              <div className="h-2 w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton para ventas por sucursal — ocupa 1/3 */}
      <div className="col-span-1 rounded-2xl md:rounded-3xl border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 p-5 md:p-6 shadow-xs">
        <div className="space-y-1.5 mb-5">
          <div className="h-4 w-36 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-28 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3.5 w-24 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3.5 w-16 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
