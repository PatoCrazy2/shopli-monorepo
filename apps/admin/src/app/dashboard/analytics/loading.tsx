export default function AnalyticsLoading() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-2 md:space-y-3 w-full max-w-md">
          <div className="h-7 md:h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
          <div className="h-3 md:h-4 w-full bg-zinc-100 dark:bg-zinc-900 rounded-md"></div>
        </div>
      </div>

      {/* Analytics Client Skeleton */}
      <div className="space-y-6 pb-10">
        
        {/* Vercel-style Command Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          {/* Tabs */}
          <div className="grid grid-cols-3 sm:flex gap-1 p-0.5 sm:p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg w-full sm:w-fit border border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="h-6 sm:h-7 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
            <div className="h-6 sm:h-7 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
            <div className="h-6 sm:h-7 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <div className="hidden sm:flex gap-0.5 p-0.5 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
               <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
               <div className="h-5 w-6 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
               <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
               <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
               <div className="h-5 w-10 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
            </div>
            <div className="h-7 sm:h-8 sm:hidden bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"></div>
            <div className="h-7 sm:h-8 sm:w-28 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"></div>
            <div className="h-7 sm:h-8 sm:w-28 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"></div>
          </div>
        </div>

        {/* Financial View Skeleton */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="bg-white dark:bg-zinc-950 p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 min-h-[5.5rem] sm:h-24 flex flex-col justify-between">
                 <div className="h-2.5 sm:h-3 w-16 sm:w-20 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                 <div className="h-6 sm:h-8 w-20 sm:w-28 bg-zinc-100 dark:bg-zinc-900 rounded-md"></div>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-[360px] flex flex-col">
               <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-6"></div>
               <div className="flex-1 w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-xl"></div>
            </div>
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-[360px] flex flex-col">
               <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-6"></div>
               <div className="flex-1 w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-full scale-[0.80]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
