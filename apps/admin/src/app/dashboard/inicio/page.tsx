import { Suspense } from "react";
import { KPICards } from "./_components/kpi-cards";
import { ChartsWrapper } from "./_components/charts-wrapper";
import { KPISkeleton, ChartsSkeleton } from "./_components/skeletons";

// force-dynamic garantiza que la página no se cachee entre requests
export const dynamic = "force-dynamic";

export default function DashboardInicioPage() {
  return (
    <div className="flex-1 space-y-8">
      {/* Header estático eliminado en favor del diseño minimalista (estilo Nu) */}

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
