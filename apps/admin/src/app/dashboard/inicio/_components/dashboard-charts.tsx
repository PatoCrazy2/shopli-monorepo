"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ChartData {
  date: string;
  total: number;
}

export function DashboardCharts({ data }: { data: ChartData[] }) {
  return (
    <div className="col-span-1 lg:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl md:rounded-3xl border border-zinc-100 dark:border-zinc-800/80 p-5 md:p-6 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-white">
            Ventas de la semana
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Comportamiento de los últimos 7 días
          </p>
        </div>
      </div>

      <div className="h-[170px] md:h-[260px] w-full mt-3">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              stroke="#a1a1aa"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <Tooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.04)", radius: 6 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-bold px-3 py-1.5 rounded-xl shadow-lg">
                      ${Number(payload[0]?.value || 0).toFixed(2)}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="total"
              radius={[6, 6, 2, 2]}
              className="fill-zinc-900 dark:fill-zinc-100"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
