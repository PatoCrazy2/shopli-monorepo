export default function CutsLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* 1. Header Compacto Sincronizado */}
      <div className="flex flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1.5">
          <div className="h-6 md:h-8 w-36 md:w-52 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="hidden md:block h-4 w-72 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
        </div>

        {/* Desktop: Formulario falso | Mobile: Botón filtros 44px */}
        <div className="hidden md:flex items-center gap-3">
          <div className="h-11 w-44 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
          <div className="h-11 w-36 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
          <div className="h-11 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
        <div className="flex md:hidden">
          <div className="h-11 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
        </div>
      </div>

      {/* 2. Lista de Tarjetas con Grid 2x2 Sincronizado */}
      <div className="flex flex-col gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-8 shadow-xs md:shadow-sm space-y-4"
          >
            {/* Header del Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-32 md:w-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-850 rounded-full" />
                  </div>
                  <div className="h-3.5 w-24 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
                </div>
              </div>

              {/* Fecha Pill */}
              <div className="h-6 w-36 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
            </div>

            {/* Grid 2x2 denso de métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-900">
              {[1, 2, 3, 4].map((j) => (
                <div
                  key={j}
                  className="h-20 p-3 rounded-xl md:rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between"
                >
                  <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
                  <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                  <div className="h-2 w-14 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
