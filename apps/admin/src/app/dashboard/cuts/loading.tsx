export default function CutsLoading() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* 1. Header Card Sincronizado */}
      <div className="bg-white dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1">
          <div className="h-6 sm:h-7 w-36 sm:w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-3.5 w-64 sm:w-72 bg-zinc-100 dark:bg-zinc-850 rounded-md" />
        </div>
      </div>

      {/* 2. Filtros Compactos Fuera de la Card */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        <div className="h-8 flex-1 sm:w-48 sm:flex-initial bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-8 flex-1 sm:w-40 sm:flex-initial bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
      </div>

      {/* 3. Lista de Tarjetas Compactas Sincronizadas */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs relative overflow-hidden"
          >
            {/* Header de Tarjeta: Barra Negra Completa de Borde a Borde */}
            <div className="bg-zinc-950 dark:bg-zinc-900 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 border-b border-zinc-900 dark:border-zinc-800">
              <div className="h-5 w-32 bg-zinc-800 dark:bg-zinc-700 rounded-md" />
              <div className="h-4 w-16 bg-zinc-800 dark:bg-zinc-700 rounded-md" />
            </div>

            {/* Contenido interior */}
            <div className="p-4 sm:p-5">
              {/* Metadata Secundaria: Sucursal · Fecha · Fondo */}
              <div className="h-3.5 w-52 bg-zinc-100 dark:bg-zinc-850 rounded-sm mb-3.5" />

              {/* Resumen Financiero: 3 Columnas */}
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

            {/* Footer Franja Gris Sincronizada */}
            <div className="bg-zinc-100/90 dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-5 py-2.5 flex items-center justify-between">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
