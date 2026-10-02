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

      {/* 1. Vista Mobile: Cards Skeleton */}
      <div className="block md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 min-w-0">
                <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-16 rounded-md bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                  <div className="h-5 w-14 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
              <div className="h-3.5 w-44 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              <div className="h-3.5 w-28 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* 2. Vista Desktop: Table Skeleton */}
      <div className="hidden md:block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">
                  <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </th>
                <th className="px-6 py-4">
                  <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </th>
                <th className="px-6 py-4">
                  <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </th>
                <th className="px-6 py-4">
                  <div className="h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {/* Usuario (Avatar + Nombre + Email) */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                        <div className="h-3 w-36 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                      </div>
                    </div>
                  </td>

                  {/* Contacto */}
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                  </td>

                  {/* Rol */}
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    <div className="h-5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-8 w-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-8 w-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
