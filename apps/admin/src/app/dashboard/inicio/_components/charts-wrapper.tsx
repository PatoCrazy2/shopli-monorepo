import { getChartsData } from "../queries";
import { DashboardCharts } from "./dashboard-charts";
import { BranchSales } from "./branch-sales";

/**
 * Async Server Component — llama a getChartsData() y renderiza las gráficas.
 * Más pesado que KPICards (3 queries). Envuelto en su propio <Suspense> en page.tsx:
 * las tarjetas KPI pueden aparecer antes que las gráficas sin bloquearse mutuamente.
 */
export async function ChartsWrapper() {
  const { chartData, branchSalesData } = await getChartsData();

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <DashboardCharts data={chartData} />
      <BranchSales data={branchSalesData} />
    </div>
  );
}
