export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-3 w-full max-w-md">
          <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
          <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900 rounded-md"></div>
        </div>
        <div className="h-12 w-32 bg-zinc-100 dark:bg-zinc-900 rounded-xl"></div>
      </div>

      {/* Analytics Client Skeleton */}
      <div className="space-y-8 pb-10">
        {/* Filters Header */}
        <div className="bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
            <div className="space-y-2"><div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-9 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl"></div></div>
            <div className="space-y-2"><div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-9 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl"></div></div>
            <div className="space-y-2"><div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-9 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl"></div></div>
            <div className="h-9 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-white dark:bg-zinc-950 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          <div className="h-10 w-32 bg-zinc-100 dark:bg-zinc-900 rounded-xl"></div>
          <div className="h-10 w-32 bg-zinc-100 dark:bg-zinc-900 rounded-xl"></div>
        </div>

        {/* Financial View Skeleton */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-32 flex flex-col justify-between">
                 <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                 <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-900 rounded-md"></div>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-[400px]">
               <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-6"></div>
               <div className="h-full w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-xl"></div>
            </div>
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-[400px]">
               <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-6"></div>
               <div className="h-full w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-xl rounded-full scale-75"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
