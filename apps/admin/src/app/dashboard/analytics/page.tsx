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
      <div className="flex-1 space-y-8 animate-in fade-in duration-1000">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
            <div className="space-y-1">
                <h2 className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white uppercase italic">
                    Inteligencia Operativa
                </h2>
                <div className="h-1 w-20 bg-blue-600 rounded-full" />
                <p className="text-sm text-muted-foreground font-medium mt-2">
                   Visualización avanzada de rentabilidad, stock y desempeño de ShopLI.
                </p>
            </div>
            
            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-white/5 px-4 py-2 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Status del Sistema</span>
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-tight leading-none mt-1">Sincronizado</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
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
