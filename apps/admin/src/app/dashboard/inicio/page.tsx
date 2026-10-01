import { Suspense } from "react";
import { KPICards } from "./_components/kpi-cards";
import { ChartsWrapper } from "./_components/charts-wrapper";
import { KPISkeleton, ChartsSkeleton } from "./_components/skeletons";

// force-dynamic garantiza que la página no se cachee entre requests
export const dynamic = "force-dynamic";

export default function DashboardInicioPage() {
  return (
    <div className="flex-1 space-y-8">
      {/* Header con el patrón exacto del dashboard en Desktop, oculto en Mobile */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            Resumen de Operaciones
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
            Vista general del rendimiento financiero y transaccional del día.
          </p>
        </div>
      </div>

      {/*
        KPI Cards — stream 1 (más rápido: 2 queries en paralelo)
        Aparece tan pronto como getKPIData() resuelve.
        Muestra KPISkeleton mientras espera.
      */}
      <Suspense fallback={<KPISkeleton />}>
        <KPICards />
      </Suspense>

      {/*
        Gráficas — stream 2 (más pesado: 3 queries en paralelo)
        Se carga en paralelo con KPICards, no bloqueada por ellas.
        Muestra ChartsSkeleton mientras espera.
      */}
      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsWrapper />
      </Suspense>
    </div>
  );
}
