import { getAnalyticsData, getFilterOptions, getInventoryAnalytics } from "./queries";
import { AnalyticsClient } from "./_components/analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    // Carga inicial: sin filtro de fechas → trae TODO el historial de la BD
    // El usuario puede acotar el rango desde los filtros del dashboard
    const initialFilters = {
        estado: "COMPLETADA" as const
    };

    // Ejecutar peticiones en paralelo para maxima velocidad (RSC)
    const [initialData, options, initialInventory] = await Promise.all([
        getAnalyticsData(initialFilters),
        getFilterOptions(),
        getInventoryAnalytics()
    ]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header & Status */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Inteligencia Operativa</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                        Visualización avanzada de rentabilidad, stock y desempeño global.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Estado</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tight leading-none mt-1">Sincronizado</span>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                </div>
            </div>
            
            <AnalyticsClient 
                initialData={initialData} 
                initialFilters={initialFilters} 
                options={options} 
                initialInventory={initialInventory}
            />
        </div>
    );
}
