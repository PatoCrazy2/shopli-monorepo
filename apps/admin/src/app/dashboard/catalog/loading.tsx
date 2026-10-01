export default function CatalogLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* 1. Header con Acciones Sincronizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-5 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
        </div>

        {/* Acciones Responsivas Sincronizadas */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <div className="h-11 w-32 sm:w-36 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-11 w-28 sm:w-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          <div className="h-11 w-28 sm:w-36 bg-zinc-900 dark:bg-zinc-700 rounded-xl" />
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="h-10 w-72 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
        <div className="h-10 w-full sm:w-64 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
      </div>

      {/* 3. Vista Móvil: Lista de Tarjetas Sincronizadas (Estilo Cortes) */}
      <div className="flex flex-col gap-4 md:hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden"
          >
            {/* Header: Barra negra */}
            <div className="bg-zinc-950 dark:bg-zinc-900 px-4 py-2.5 flex items-center justify-between gap-3 border-b border-zinc-900 dark:border-zinc-800">
              <div className="h-5 w-36 bg-zinc-800 dark:bg-zinc-700 rounded-md" />
              <div className="h-4 w-14 bg-zinc-800 dark:bg-zinc-700 rounded-md" />
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-3">
              <div className="h-3.5 w-28 bg-zinc-100 dark:bg-zinc-850 rounded-sm" />
              <div className="grid grid-cols-2 gap-2 bg-zinc-50/70 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-900/60 p-2.5">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-2.5 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-xs" />
                  <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-2.5 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-xs" />
                  <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                </div>
              </div>
            </div>

            {/* Footer Franja Gris */}
            <div className="bg-zinc-100/90 dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 p-2 flex items-center gap-2">
              <div className="flex-1 h-8.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              <div className="flex-1 h-8.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
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
