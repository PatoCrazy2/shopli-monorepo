export default function AuditsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* 1. Header Card Sincronizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-7 sm:h-8 w-48 sm:w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-5 w-8 bg-zinc-100 dark:bg-zinc-850 rounded-full" />
          </div>
          <div className="h-3.5 w-64 sm:w-80 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
        </div>

        {/* Filtros Skeleton */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="h-10 flex-1 sm:w-56 sm:flex-initial bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-10 flex-1 sm:w-44 sm:flex-initial bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>

      {/* 2. Lista de Tarjetas de Auditoría */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-xs flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
              {/* Ícono Monocromático Skeleton */}
              <div className="w-11 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />

              <div className="flex flex-col gap-2 min-w-0 flex-1">
                {/* Título y Badge */}
                <div className="flex items-center gap-2">
                  <div className="h-5 w-44 sm:w-52 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  <div className="h-5 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-full" />
                </div>

                {/* Metadata: Sucursal · Fecha · Hora · Productos */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-3.5 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-sm" />
                  <div className="h-3.5 w-20 bg-zinc-100 dark:bg-zinc-850 rounded-sm" />
                  <div className="h-3.5 w-16 bg-zinc-100 dark:bg-zinc-850 rounded-sm" />
                  <div className="h-3.5 w-20 bg-zinc-100 dark:bg-zinc-850 rounded-sm hidden sm:block" />
                </div>
              </div>
            </div>

            {/* Flecha lateral Skeleton */}
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
