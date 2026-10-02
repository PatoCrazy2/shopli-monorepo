export default function UsersLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Compacto Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 sm:h-8 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          </div>
          <div className="h-3.5 sm:h-4 w-60 sm:w-80 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>

        {/* Botones de acción agrupados (POS + Nuevo Usuario) */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="h-9 sm:h-10 w-28 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
          <div className="h-9 sm:h-10 flex-1 sm:flex-initial sm:w-32 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
        </div>
      </div>

      {/* Filter Tabs & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="h-9 sm:h-10 w-full sm:w-56 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        <div className="h-9 sm:h-10 w-full sm:w-72 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      </div>

      {/* Lista de Tarjetas Largas Skeleton */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-4 gap-3 sm:gap-4"
            >
              {/* Usuario (Avatar + Info) */}
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-48 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                </div>
              </div>

              {/* Badges y Acciones */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-zinc-100 dark:border-zinc-800/60 sm:border-0">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="h-8 w-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
