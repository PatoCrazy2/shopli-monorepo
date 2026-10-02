import { getAnalyticsData, getFilterOptions } from "./queries";
import { AnalyticsClient } from "./_components/analytics-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessAnalytics } from "@/lib/check-plan-limits";
import { UpgradeGateBanner } from "@/components/UpgradeGateBanner";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    const session = await auth();
    if (!session?.user?.empresa_id) redirect("/login");
    const empresaId = session.user.empresa_id;

    const hasAnalyticsAccess = await canAccessAnalytics(empresaId);

    if (!hasAnalyticsAccess) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Inteligencia Operativa</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                            Visualización avanzada de rentabilidad y desempeño global.
                        </p>
                    </div>
                </div>

                <UpgradeGateBanner
                    title="Analítica Avanzada y Rentabilidad"
                    description="El módulo de Inteligencia Operativa te permite ver márgenes reales, histórico de ventas por hora y tendencias para maximizar las ganancias de tu negocio."
                    featureList={[
                        "Márgenes de ganancia brutos y netos en tiempo real",
                        "Desempeño de ventas por cajero y sucursal",
                        "Gráficos históricos y tendencias de demanda",
                        "Balance mensual consolidado (Ingresos vs Gastos)",
                    ]}
                    requiredPlanName="Plan Crecimiento"
                />
            </div>
        );
    }

    const initialFilters = {
        estado: "COMPLETADA" as const
    };

    const [initialData, options] = await Promise.all([
        getAnalyticsData(initialFilters),
        getFilterOptions()
    ]);

    return (
        <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-20">
            <div className="bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Inteligencia Operativa</h1>
                    <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        Visualización avanzada de rentabilidad y desempeño global.
                    </p>
                </div>
            </div>
            
            <AnalyticsClient 
                initialData={initialData} 
                initialFilters={initialFilters} 
                options={options} 
            />
        </div>
    );
}
