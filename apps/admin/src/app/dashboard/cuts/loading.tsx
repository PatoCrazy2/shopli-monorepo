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

      {/* 2. Lista de Tarjetas Compactas Sincronizadas */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden"
          >
            {/* 1. Fila Superior: Badge Nombre del Cajero + Estado a la derecha */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="h-7 w-28 bg-zinc-900 dark:bg-zinc-800 rounded-xl" />
              <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-md" />
            </div>

            {/* 2. Segunda Fila (Metadata Secundaria): Sucursal · Fecha · Fondo */}
            <div className="h-3.5 w-52 bg-zinc-100 dark:bg-zinc-850 rounded-sm mb-3.5" />

            {/* 3. Resumen Financiero: 3 Columnas centradas en móvil */}
            <div className="grid grid-cols-3 gap-1 sm:gap-4 py-1 text-center sm:text-left">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <div className="h-3 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-xs" />
                <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-2.5 w-16 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
              </div>
              <div className="flex flex-col items-center sm:items-start gap-1">
                <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-xs" />
                <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-2.5 w-16 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
              </div>
              <div className="flex flex-col items-center sm:items-start gap-1">
                <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-xs" />
                <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-2.5 w-14 bg-zinc-100 dark:bg-zinc-850 rounded-xs" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
