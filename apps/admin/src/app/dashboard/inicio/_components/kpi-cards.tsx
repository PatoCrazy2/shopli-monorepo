import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { DollarSign, TrendingUp, ReceiptText } from "lucide-react";
import { getKPIData } from "../queries";

/**
 * Async Server Component — llama a getKPIData() y renderiza las 3 tarjetas de KPI.
 * Envuelto en <Suspense> en page.tsx: se muestra tan pronto como resuelva,
 * sin bloquear la renderización de las gráficas ni del header.
 */
export async function KPICards() {
  const { ventasHoy, gananciaHoy, ticketsTotales } = await getKPIData();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${ventasHoy.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Ventas completadas del día</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ganancias Hoy</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${gananciaHoy.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Ingresos menos costos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tickets Totales</CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{ticketsTotales}</div>
          <p className="text-xs text-muted-foreground">Tickets generados hoy</p>
        </CardContent>
      </Card>
    </div>
  );
}
