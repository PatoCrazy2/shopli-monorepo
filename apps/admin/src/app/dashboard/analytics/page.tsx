import { getAnalyticsData, getFilterOptions } from "./queries";
import { AnalyticsClient } from "./_components/analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
   // Fecha por defecto: ultimos 30 días
   const end = new Date();
   const start = new Date();
   start.setDate(end.getDate() - 30);
   
   const initialFilters = {
       startDate: start.toISOString().split("T")[0],
       endDate: end.toISOString().split("T")[0],
       estado: "COMPLETADA" as const
   };

   const [initialData, options] = await Promise.all([
       getAnalyticsData(initialFilters),
       getFilterOptions()
   ]);

   return (
      <div className="flex-1 space-y-6 animate-in fade-in duration-500">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-1">
            <h2 className="text-3xl font-bold tracking-tight">Análisis Operativo</h2>
            <p className="text-sm text-gray-500 max-w-sm md:text-right">
               Explora rentabilidad, ventas e inventario mediante un filtrado dinámico.
            </p>
         </div>
         
         <AnalyticsClient 
            initialData={initialData} 
            initialFilters={initialFilters} 
            options={options} 
         />
      </div>
   );
}
