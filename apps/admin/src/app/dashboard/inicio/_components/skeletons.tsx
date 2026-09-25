/**
 * Skeletons del Dashboard de Inicio.
 * Animados con animate-pulse, mismas dimensiones que los componentes reales
 * para evitar saltos de layout (CLS = 0) cuando el contenido real aparece.
 */

export function KPISkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-100" />
            <div className="h-4 w-4 animate-pulse rounded-md bg-zinc-100" />
          </div>
          <div className="mt-2 space-y-2">
            <div className="h-8 w-32 animate-pulse rounded-md bg-zinc-100" />
            <div className="h-3 w-28 animate-pulse rounded-md bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      {/* Skeleton para la gráfica de barras — ocupa 2/3 */}
      <div className="col-span-1 lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-2 mb-6">
          <div className="h-5 w-48 animate-pulse rounded-md bg-zinc-100" />
          <div className="h-3 w-64 animate-pulse rounded-md bg-zinc-100" />
        </div>
        {/* Barras del chart */}
        <div className="flex items-end gap-3 h-[260px] pt-4">
          {[65, 40, 80, 55, 90, 45, 70].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-1">
              <div
                className="w-full animate-pulse rounded-t-md bg-zinc-100"
                style={{ height: `${height}%` }}
              />
              <div className="h-3 w-full animate-pulse rounded-md bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton para ventas por sucursal — ocupa 1/3 */}
      <div className="col-span-1 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-2 mb-6">
          <div className="h-5 w-36 animate-pulse rounded-md bg-zinc-100" />
          <div className="h-3 w-28 animate-pulse rounded-md bg-zinc-100" />
        </div>
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-100" />
                <div className="h-4 w-16 animate-pulse rounded-md bg-zinc-100" />
              </div>
              <div className="h-2 w-full animate-pulse rounded-full bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
