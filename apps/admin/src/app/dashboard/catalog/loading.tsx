export default function CatalogLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* 1. Header Compacto (Estilo Cortes) con Acciones Sincronizado */}
      <div className="flex flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 md:h-9 w-28 md:w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4.5 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="hidden md:block h-4 w-64 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
        </div>

        {/* Acciones Responsivas Sincronizadas */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="h-9 sm:h-11 w-9 sm:w-36 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-9 sm:h-11 w-9 sm:w-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-9 sm:h-11 w-16 sm:w-36 bg-zinc-900 dark:bg-zinc-700 rounded-xl" />
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="h-10 w-72 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
        <div className="h-10 w-full sm:w-64 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
      </div>

      {/* 3. Vista Móvil: Filas Ultra-Compactas Sincronizadas (~60px) */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-sm space-y-2"
          >
            {/* Fila 1: Nombre y Precio */}
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
              <div className="h-4 w-14 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
            </div>

            {/* Fila 2: SKU · Costo y Botones de acción */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
              <div className="h-3 w-40 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Vista Escritorio: Tabla Sincronizada */}
      <div className="hidden md:block rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        <div className="w-full">
          {/* Header de tabla */}
          <div className="h-12 bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-6 items-center px-6">
            <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-xs" />
            <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xs" />
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-xs justify-self-end" />
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-xs justify-self-end" />
            <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-800 rounded-xs justify-self-center" />
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-xs justify-self-center" />
          </div>
          {/* Filas */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="h-14 grid grid-cols-6 items-center px-6">
                <div className="h-3.5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-xs" />
                <div className="h-4 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-sm justify-self-end" />
                <div className="h-3.5 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-xs justify-self-end" />
                <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full justify-self-center" />
                <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg justify-self-center" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
