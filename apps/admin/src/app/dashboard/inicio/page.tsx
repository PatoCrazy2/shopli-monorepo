import { getDashboardData } from "./queries";
import { DashboardCharts } from "./_components/dashboard-charts";
import { BranchSales } from "./_components/branch-sales";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { DollarSign, TrendingUp, ReceiptText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardInicioPage() {
  const data = await getDashboardData();

  return (
    <div className="flex-1 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Resumen de Operaciones</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            Vista general del rendimiento financiero y transaccional del día.
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Hoy
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.ventasHoy.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ventas completadas del día
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancias Hoy
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.gananciaHoy.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos menos costos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tickets Totales
            </CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{data.ticketsTotales}</div>
            <p className="text-xs text-muted-foreground">
              Tickets generados hoy
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <DashboardCharts data={data.chartData} />
        <BranchSales data={data.branchSalesData} />
      </div>
    </div>
  );
}
