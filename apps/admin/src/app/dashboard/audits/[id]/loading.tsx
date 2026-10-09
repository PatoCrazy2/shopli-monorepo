export default function AuditReportLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* 1. Header Card Sincronizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
            <div className="h-8 w-60 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-5 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-full" />
          </div>
          <div className="h-3.5 w-72 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
        </div>

        {/* Botón de Acción Skeleton */}
        <div className="h-10 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* 2. Grid de 4 KPIs Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2"
          >
            <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
            <div className="h-7 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* 3. Filtros de Tabla Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-8 w-28 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
        <div className="h-8 w-28 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
        <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
      </div>

      {/* 4. Tabla de Ítems Skeleton */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between">
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
              </div>
              <div className="flex items-center gap-6">
                <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
                <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
