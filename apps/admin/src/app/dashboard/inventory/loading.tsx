export default function InventoryLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* 1. Header Compacto (Estilo Catálogo) Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-5 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="h-4 w-72 bg-zinc-100 dark:bg-zinc-850 rounded hidden md:block" />
        </div>

        {/* Monto Total Skeleton */}
        <div className="flex flex-col sm:items-end space-y-1.5">
          <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-850 rounded" />
          <div className="h-8 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
      </div>

      {/* 2. Barra de Comandos y Filtros Rápidos Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        {/* Buscador Skeleton */}
        <div className="h-10 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />

        {/* Acciones: Escáner y Sucursal Skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 bg-zinc-900/10 dark:bg-zinc-800 rounded-xl shrink-0" />
          <div className="h-10 w-full sm:w-[280px] bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0" />
        </div>

        {/* Píldoras Skeleton */}
        <div className="flex items-center gap-2 py-0.5">
          <div className="h-8 w-20 bg-zinc-900/10 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800" />
          <div className="h-8 w-28 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800" />
        </div>

        {/* Botón Bitácora Skeleton */}
        <div className="h-8 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800" />
      </div>

      {/* 3. Skeleton Adaptativo: Cards Móvil vs Tabla Desktop */}
      {/* Vista Móvil Skeleton (md:hidden) */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-850 rounded" />
              </div>
              <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-850">
              <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-850 rounded" />
              <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-850 rounded" />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-10 bg-zinc-900/10 dark:bg-zinc-800 rounded-xl" />
              <div className="flex-1 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Vista Desktop Skeleton (hidden md:block) */}
      <div className="hidden md:block bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        {/* Thead Skeleton */}
        <div className="h-10 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-8 items-center px-4">
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded col-span-2" />
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded hidden md:block" />
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded justify-self-end" />
          <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded justify-self-center" />
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded justify-self-end hidden sm:block" />
          <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-800 rounded justify-self-center" />
        </div>

        {/* Filas Skeleton */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div key={row} className="h-12 grid grid-cols-8 items-center px-4">
              <div className="h-3.5 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-44 bg-zinc-200 dark:bg-zinc-800 rounded col-span-2" />
              <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-850 rounded hidden md:block" />
              <div className="h-3.5 w-14 bg-zinc-100 dark:bg-zinc-800 rounded justify-self-end" />
              <div className="h-5 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-md justify-self-center" />
              <div className="h-3.5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded justify-self-end hidden sm:block" />
              <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-md justify-self-center" />
              <div className="h-7 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg justify-self-center" />
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="h-10 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 px-4 flex items-center">
          <div className="h-3 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  );
}
