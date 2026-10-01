export default function CutsLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* Header & Filter Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-2.5">
          <div className="h-9 w-52 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-4 w-72 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="h-11 w-44 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
          <div className="h-11 w-36 bg-zinc-100 dark:bg-zinc-850 rounded-xl" />
          <div className="h-11 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>

      {/* Cards / List Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              <div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-850 rounded-full" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-8 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-850 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
