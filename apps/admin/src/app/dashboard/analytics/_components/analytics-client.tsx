"use client";

import { useState, useEffect } from "react";
import { fetchAnalyticsData } from "../actions";
import { AnalyticsFilters, AnalyticsData } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/card";
import { Progress } from "@repo/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Percent, TrendingUp, Package, Search } from "lucide-react";

type FilterOptions = {
    sucursales: { id: string; nombre: string }[];
    usuarios: { id: string; name: string | null; email: string }[];
};

export function AnalyticsClient({ initialData, initialFilters, options }: { initialData: AnalyticsData, initialFilters: AnalyticsFilters, options: FilterOptions }) {
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"resumen" | "ventas" | "productos">("resumen");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAnalyticsData(filters);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val || undefined }));
  };

  const currentMarginPercent = data.summary.totalRevenue > 0 
      ? (data.summary.grossProfit / data.summary.totalRevenue) * 100 
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
         
         <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
            <div className="space-y-1">
               <label className="text-xs font-medium text-gray-500">Fecha Inicio</label>
               <input 
                 type="date" 
                 className="w-full text-sm p-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-black"
                 value={filters.startDate || ""}
                 onChange={(e) => handleFilterChange("startDate", e.target.value)}
               />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-medium text-gray-500">Fecha Fin</label>
               <input 
                 type="date" 
                 className="w-full text-sm p-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-black"
                 value={filters.endDate || ""}
                 onChange={(e) => handleFilterChange("endDate", e.target.value)}
               />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-medium text-gray-500">Sucursal</label>
               <select 
                 className="w-full text-sm p-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-black"
                 value={filters.sucursalId || ""}
                 onChange={(e) => handleFilterChange("sucursalId", e.target.value)}
               >
                  <option value="">Todas</option>
                  {options.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-medium text-gray-500">Usuario / Cajero</label>
               <select 
                 className="w-full text-sm p-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-black"
                 value={filters.usuarioId || ""}
                 onChange={(e) => handleFilterChange("usuarioId", e.target.value)}
               >
                  <option value="">Todos</option>
                  {options.usuarios.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
               </select>
            </div>
         </div>
         
         <button 
           onClick={loadData}
           disabled={loading}
           className="w-full md:w-auto px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
         >
           <Search size={16} />
           {loading ? "Calculando..." : "Analizar Periodo"}
         </button>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800">
         <TabButton active={activeTab === "resumen"} onClick={() => setActiveTab("resumen")}>General & Tendencias</TabButton>
         <TabButton active={activeTab === "ventas"} onClick={() => setActiveTab("ventas")}>Ventas por Sucursal / Cajero</TabButton>
         <TabButton active={activeTab === "productos"} onClick={() => setActiveTab("productos")}>Top Productos & Margen</TabButton>
         {loading && <span className="ml-auto text-xs text-brand-blue font-medium animate-pulse">Actualizando...</span>}
      </div>

      <div className="min-h-[400px]">
          {activeTab === "resumen" && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard title="Monto de Ventas" value={`$${data.summary.totalRevenue.toFixed(2)}`} icon={<DollarSign size={16} />} />
                  <MetricCard title="Costo de Inventario" desc="Costo de bienes vendidos" value={`$${data.summary.totalCosts.toFixed(2)}`} icon={<Package size={16} />} />
                  <MetricCard title="Margen o Utilidad Bruta" value={`$${data.summary.grossProfit.toFixed(2)}`} icon={<TrendingUp size={16} />} />
                  <MetricCard title="Ticket Promedio" desc={`${data.summary.totalTransactions} transacciones`} value={`$${data.summary.averageTicket.toFixed(2)}`} icon={<Percent size={16} />} />
               </div>

               <Card>
                 <CardHeader>
                   <CardTitle>Tendencia de Ventas</CardTitle>
                   <CardDescription>Cronología de transacciones del periodo consultado.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="h-[300px] w-full">
                      {data.dateSales.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-sm text-gray-500">No hay transacciones en el periodo.</div>
                      ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.dateSales}>
                              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                              <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Ventas"]} />
                              <Bar dataKey="totalSales" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-black dark:fill-white" />
                            </BarChart>
                          </ResponsiveContainer>
                      )}
                    </div>
                 </CardContent>
               </Card>
             </div>
          )}

          {activeTab === "ventas" && (
             <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-300">
               <ListCard 
                  title="Ventas por Sucursal" 
                  desc="Aportación al ingreso total."
                  items={data.branchSales.map(v => ({ label: v.branchName, value: v.totalSales, sub: `${v.transactionCount} tickets` }))} 
                  maxVal={data.summary.totalRevenue} 
               />
               <ListCard 
                  title="Ventas por Usuario" 
                  desc="Desempeño de cajeros/empleados."
                  items={data.userSales.map(v => ({ label: v.userName, value: v.totalSales, sub: `${v.transactionCount} tickets` }))} 
                  maxVal={data.summary.totalRevenue} 
               />
             </div>
          )}

          {activeTab === "productos" && (
             <Card className="animate-in fade-in duration-300">
                <CardHeader>
                   <CardTitle>Rendimiento por Producto (Top 15)</CardTitle>
                   <CardDescription>Rentabilidad y volumen de movimiento.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto p-0">
                   <table className="w-full text-sm text-left border-t border-gray-100 dark:border-zinc-800">
                      <thead className="text-xs text-gray-500 bg-gray-50/50 dark:bg-zinc-900/50 uppercase font-semibold">
                         <tr>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4 text-right">Cantidad</th>
                            <th className="px-6 py-4 text-right">Ingreso</th>
                            <th className="px-6 py-4 text-right">Margen Bruto</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                         {data.topProducts.map((p, idx) => (
                           <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                              <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{p.productName}</td>
                              <td className="px-6 py-3">{p.category || "-"}</td>
                              <td className="px-6 py-3 text-right">{p.unitsSold} uds.</td>
                              <td className="px-6 py-3 text-right">${p.revenue.toFixed(2)}</td>
                              <td className="px-6 py-3 text-right text-green-600 dark:text-green-500 font-medium">
                                 +${p.grossMargin.toFixed(2)}
                              </td>
                           </tr>
                         ))}
                         {data.topProducts.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Sin datos de productos en este periodo.</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </Card>
          )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active 
          ? "border-black text-black dark:border-white dark:text-white" 
          : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({ title, desc, value, icon }: { title: string, desc?: string, value: string, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
         <CardTitle className="text-sm font-medium">{title}</CardTitle>
         <span className="text-gray-400">{icon}</span>
      </CardHeader>
      <CardContent>
         <div className="text-2xl font-bold">{value}</div>
         {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
      </CardContent>
    </Card>
  );
}

function ListCard({ title, desc, items, maxVal }: { title: string, desc: string, items: {label: string, value: number, sub: string}[], maxVal: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">No hay datos.</p>
          ) : (
             items.map((item, idx) => {
               const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
               return (
                 <div key={idx} className="space-y-2">
                   <div className="flex items-center justify-between text-sm">
                     <span className="font-medium text-gray-900 dark:text-gray-100 flex flex-col">
                        {item.label}
                        <span className="text-xs font-normal text-gray-500">{item.sub}</span>
                     </span>
                     <span className="font-semibold">${item.value.toFixed(2)}</span>
                   </div>
                   <Progress value={percentage} className="h-2" />
                 </div>
               );
             })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
