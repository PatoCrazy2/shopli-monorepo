"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/card";

interface ChartData {
  date: string;
  total: number;
}

export function DashboardCharts({ data }: { data: ChartData[] }) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Resumen de Ventas de la Semana</CardTitle>
        <CardDescription>
          Ventas consolidadas de los últimos 7 días.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={data}>
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value}`} 
              />
              <Tooltip 
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Ventas"]}
              />
              <Bar 
                dataKey="total" 
                fill="currentColor" 
                radius={[4, 4, 0, 0]} 
                className="fill-primary" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
