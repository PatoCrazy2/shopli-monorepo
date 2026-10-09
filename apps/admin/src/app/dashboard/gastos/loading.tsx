export default function GastosLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* 1. Header Card Sincronizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-7 sm:h-8 w-44 sm:w-52 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-5 w-8 bg-zinc-100 dark:bg-zinc-850 rounded-full" />
          </div>
          <div className="h-3.5 w-60 sm:w-80 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
        </div>

        {/* Filtros Skeleton */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="h-10 flex-1 sm:w-48 sm:flex-initial bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 flex-1 sm:w-40 sm:flex-initial bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 flex-1 sm:w-40 sm:flex-initial bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl hidden sm:block" />
        </div>
      </div>

      {/* 2. Grid de 4 Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs space-y-3 min-h-[6.5rem] sm:min-h-[7.5rem] flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-850" />
            </div>
            <div className="space-y-1">
              <div className="h-6 sm:h-7 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-2.5 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Tabla Skeleton */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-900/30 flex items-center justify-between">
          <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
              </div>
              <div className="flex items-center gap-6">
                <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
                <div className="h-5 w-20 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
                <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
                <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
