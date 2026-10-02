export default function UsersLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-36 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-6 w-20 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          </div>
          <div className="h-4 w-64 md:w-96 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>

        <div className="h-11 w-36 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
      </div>

      {/* Filter Tabs & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Tabs skeleton */}
          <div className="h-10 w-56 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          {/* POS Access button skeleton */}
          <div className="h-10 w-32 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
        {/* Search input skeleton */}
        <div className="h-10 w-full sm:w-72 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
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
