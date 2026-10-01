"use client";

interface BranchSale {
  name: string;
  total: number;
}

export function BranchSales({ data }: { data: BranchSale[] }) {
  const totalAllBranches = data.reduce((acc, curr) => acc + curr.total, 0) || 1;

  return (
    <div className="col-span-1 lg:col-span-1 bg-white dark:bg-zinc-950 rounded-2xl md:rounded-3xl border border-zinc-100 dark:border-zinc-800/80 p-5 md:p-6 shadow-xs flex flex-col justify-between">
      <div className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
        <h3 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-white">
          Ventas por sucursal
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Distribución de ingresos de hoy
        </p>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-900 my-auto py-2">
        {data.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs font-mono text-zinc-400">
              Sin transacciones registradas hoy
            </p>
          </div>
        ) : (
          data.map((item, index) => {
            const percentage = Math.round((item.total / totalAllBranches) * 100);

            return (
              <div key={index} className="py-3 first:pt-1 last:pb-1 space-y-1.5">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate pr-2">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      ${item.total.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-zinc-400 w-8 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
                {/* Indicador lineal sutil de proporción */}
                <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
