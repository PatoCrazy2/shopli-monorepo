export default function SalesLoading() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header & CommandBar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-2">
          <div className="h-8 md:h-10 w-36 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-64 md:w-80 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-9 w-full sm:w-48 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-9 w-24 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-9 w-32 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
      </div>

      {/* Summary Row Skeleton */}
      <div className="flex items-center justify-between px-1 gap-2">
        <div className="space-y-1.5">
          <div className="h-4 w-32 sm:w-44 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-3 w-24 sm:w-32 rounded-md bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>

        <div className="flex flex-col items-end space-y-1">
          <div className="h-2.5 w-20 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-7 sm:h-9 w-24 sm:w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>

      {/* Sales List Skeleton */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-xs overflow-hidden flex flex-col">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3"
            >
              <div className="flex flex-1 items-center gap-4 sm:gap-6 flex-wrap">
                {/* Fecha */}
                <div className="w-32 sm:w-44 h-4 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />

                {/* Cajero */}
                <div className="flex items-center gap-2 min-w-[160px]">
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="w-24 h-3.5 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                </div>

                {/* Items */}
                <div className="h-5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              </div>

              {/* Total y Estado */}
              <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full border-t border-zinc-100 dark:border-zinc-800 sm:border-0 pt-2 sm:pt-0">
                <div className="h-5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                <div className="flex items-center gap-3">
                  <div className="w-16 h-6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Paginación Skeleton */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-7 w-14 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-7 w-14 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
