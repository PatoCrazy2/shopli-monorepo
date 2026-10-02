"use client";

import { useState } from "react";
import { fetchAnalyticsData } from "../actions";
import { AnalyticsFilters, AnalyticsData } from "../types";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
    DollarSign, TrendingUp, AlertTriangle, 
    Activity, ShoppingBag, Landmark, Scale, Store, Users, Receipt,
    Package
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

type FilterOptions = {
    sucursales: { id: string; nombre: string }[];
    usuarios: { id: string; name: string | null; email: string }[];
};

export function AnalyticsClient({ 
    initialData, 
    initialFilters, 
    options
}: { 
    initialData: AnalyticsData, 
    initialFilters: AnalyticsFilters, 
    options: FilterOptions
}) {
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"finanzas" | "operaciones" | "catalogo">("finanzas");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAnalyticsData(filters);
      setData(res);
    } catch (e) {
      console.error("[Analytics Client] Error:", e);
      setError(e instanceof Error ? e.message : "Error desconocido al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val || undefined }));
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Filters Header (Compact & High Density) */}
      <div className="bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Rango de Fechas</label>
            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
              <input 
                type="date" 
                className="h-9 md:h-10 px-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all dark:bg-zinc-900 dark:border-zinc-800"
                value={filters.startDate || ""}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
              <span className="text-zinc-300 font-black">/</span>
              <input 
                type="date" 
                className="h-9 md:h-10 px-3 w-full rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all dark:bg-zinc-900 dark:border-zinc-800"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Sucursal</label>
            <select 
              className="h-9 md:h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all appearance-none pr-8 relative dark:bg-zinc-900 dark:border-zinc-800"
              value={filters.sucursalId || ""}
              onChange={(e) => handleFilterChange("sucursalId", e.target.value)}
            >
               <option value="">Consolidado Global</option>
               {options.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Cajero / Staff</label>
            <select 
              className="h-9 md:h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all appearance-none pr-8 relative dark:bg-zinc-900 dark:border-zinc-800"
              value={filters.usuarioId || ""}
              onChange={(e) => handleFilterChange("usuarioId", e.target.value)}
            >
               <option value="">Todos los Usuarios</option>
               {options.usuarios.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
          </div>

          <button 
            onClick={loadData}
            disabled={loading}
            className="h-9 md:h-10 px-6 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {loading ? "Calculando..." : "Aplicar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-rose-700 dark:text-rose-400">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="text-xs font-mono font-medium">{error}</span>
        </div>
      )}

      {/* Tabs / Segmented Control */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800 overflow-x-auto hide-scrollbar max-w-full">
         <TabButton active={activeTab === "finanzas"} onClick={() => setActiveTab("finanzas")} icon={<Landmark size={14} />}>Finanzas (P&L)</TabButton>
         <TabButton active={activeTab === "operaciones"} onClick={() => setActiveTab("operaciones")} icon={<Activity size={14} />}>Operaciones</TabButton>
         <TabButton active={activeTab === "catalogo"} onClick={() => setActiveTab("catalogo")} icon={<ShoppingBag size={14} />}>Catálogo</TabButton>
         {loading && <div className="ml-2 px-3 py-1.5 flex items-center"><div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div></div>}
      </div>

      <div className="min-h-[600px] transition-all duration-300">
          {activeTab === "finanzas" && (
             <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard 
                    title="Ingreso Bruto" 
                    value={`$${data.summary.totalRevenue.toLocaleString()}`} 
                    icon={<DollarSign />}
                  />
                  <MetricCard 
                    title="Costo de Venta (COGS)" 
                    value={`$${data.summary.totalCosts.toLocaleString()}`} 
                    icon={<Package />}
                  />
                  <MetricCard 
                    title="Utilidad Bruta" 
                    value={`$${data.summary.grossProfit.toLocaleString()}`} 
                    desc={`${data.summary.marginPercent.toFixed(1)}% Margen`}
                    icon={<TrendingUp />}
                    polarity={data.summary.grossProfit >= 0 ? "positive" : "negative"}
                  />
                   <MetricCard 
                    title="Utilidad Neta" 
                    value={`$${data.summary.netProfit.toLocaleString()}`} 
                    desc={`Tras $${data.summary.totalExpenses.toLocaleString()} operativos`}
                    icon={<Scale />}
                    polarity={data.summary.netProfit >= 0 ? "positive" : "negative"}
                  />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-[400px]">
                   <div className="mb-6">
                      <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">Flujo de Ingresos</h3>
                   </div>
                   <div className="w-full flex-1">
                     {data.dateSales.length === 0 ? <EmptyState /> : (
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={data.dateSales}>
                             <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
                             <XAxis dataKey="date" stroke="currentColor" className="text-zinc-400" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                             <YAxis stroke="currentColor" className="text-zinc-400" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} fontFamily="monospace" width={60} />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', color: '#fff' }}
                                formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, "Ingreso"]}
                             />
                             <Area type="monotone" dataKey="totalSales" stroke="#18181b" strokeWidth={2} fillOpacity={0.05} fill="#18181b" className="dark:stroke-zinc-300 dark:fill-zinc-300" />
                           </AreaChart>
                         </ResponsiveContainer>
                     )}
                   </div>
                 </div>

                 <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-[400px]">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">Desglose de Gastos</h3>
                    </div>
                    <div className="w-full flex-1">
                        {data.expensesByCategory.length === 0 ? <EmptyState /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.expensesByCategory} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {data.expensesByCategory.map((_, index) => (
                                          <Cell key={`cell-${index}`} fill="currentColor" className={cn(
                                            index === 0 ? "text-zinc-900 dark:text-zinc-100" :
                                            index === 1 ? "text-zinc-700 dark:text-zinc-300" :
                                            index === 2 ? "text-zinc-500 dark:text-zinc-500" :
                                            index === 3 ? "text-zinc-400 dark:text-zinc-600" :
                                            "text-zinc-300 dark:text-zinc-800"
                                          )} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                      formatter={(value: any) => [`$${(value || 0).toLocaleString()}`, 'Total']}
                                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                 </div>
               </div>
             </div>
          )}

          {activeTab === "operaciones" && (
             <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricCard title="Transacciones" value={data.summary.totalTransactions.toLocaleString()} icon={<Receipt />} />
                  <MetricCard title="Ticket Promedio" value={`$${data.summary.averageTicket.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<DollarSign />} />
                  <MetricCard title="Sucursales Activas" value={data.branchSales.length.toString()} icon={<Store />} />
               </div>

               <div className="grid gap-6 lg:grid-cols-2">
                 <ListCard 
                    title="Rendimiento por Sucursal" 
                    icon={<Store size={16} />}
                    items={data.branchSales.map(v => ({ 
                      label: v.branchName, 
                      value: v.totalSales, 
                      sub: `${v.transactionCount} txs • T.P. $${(v.totalSales / (v.transactionCount || 1)).toFixed(2)}`, 
                      id: v.branchId 
                    }))} 
                    maxVal={data.summary.totalRevenue} 
                 />
                 <ListCard 
                    title="Productividad Staff" 
                    icon={<Users size={16} />}
                    items={data.userSales.map(v => ({ 
                      label: v.userName, 
                      value: v.totalSales, 
                      sub: `${v.transactionCount} txs • T.P. $${(v.totalSales / (v.transactionCount || 1)).toFixed(2)}`, 
                      id: v.userId 
                    }))} 
                    maxVal={data.summary.totalRevenue} 
                 />
               </div>
             </div>
          )}

          {activeTab === "catalogo" && (
             <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-900">
                   <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <ShoppingBag size={16} className="text-zinc-400" />
                      Rentabilidad del Mix Comercial
                   </h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-500 tracking-widest uppercase font-bold">
                         <tr>
                            <th className="px-6 py-3">Producto</th>
                            <th className="px-6 py-3">Categoría</th>
                            <th className="px-6 py-3 text-right">Volumen</th>
                            <th className="px-6 py-3 text-right">Ingreso Bruto</th>
                            <th className="px-6 py-3 text-right">Margen Bruto</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                         {data.topProducts.map((p, idx) => (
                           <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                              <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-medium text-sm">{p.productName}</td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500">{p.category || "General"}</span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-sm text-zinc-600 dark:text-zinc-400">{p.unitsSold}</td>
                              <td className="px-6 py-4 text-right font-mono text-sm text-zinc-900 dark:text-zinc-100">${p.revenue.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right font-mono text-sm">
                                <span className={cn(p.grossMargin >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500")}>
                                  {p.grossMargin >= 0 ? "+" : "-"}${Math.abs(p.grossMargin).toLocaleString()}
                                </span>
                              </td>
                           </tr>
                         ))}
                         {data.topProducts.length === 0 && (
                           <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-mono uppercase tracking-widest text-zinc-400">Sin datos</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children, icon }: { active: boolean, onClick: () => void, children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all rounded-xl flex items-center gap-2 whitespace-nowrap", 
      active ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
    )}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

function MetricCard({ title, desc, value, icon, polarity }: { title: string, desc?: string, value: string, icon: React.ReactNode, polarity?: "positive" | "negative" }) {
  return (
    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-32">
       <div className="flex justify-between items-start gap-4 mb-2">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{title}</p>
          <div className="text-zinc-400 [&>svg]:w-4 [&>svg]:h-4">{icon}</div>
       </div>
       <div>
         <h3 className={cn("text-3xl font-mono tabular-nums tracking-tight leading-none", 
           polarity === "positive" ? "text-emerald-600 dark:text-emerald-500" : 
           polarity === "negative" ? "text-rose-600 dark:text-rose-500" : 
           "text-zinc-900 dark:text-white"
         )}>{value}</h3>
         {desc && <p className="mt-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{desc}</p>}
       </div>
    </div>
  );
}

function ListCard({ title, items, maxVal, icon }: { title: string, items: {label: string, value: number, sub: string, id: string}[], maxVal: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-2">
         <div className="text-zinc-400">{icon}</div>
         <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{title}</h3>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-6">
          {items.length === 0 ? <EmptyState /> : items.map((item) => {
            const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
            return (
              <div key={item.id} className="space-y-2">
                <div className="flex items-end justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm truncate max-w-[150px] sm:max-w-[200px]">{item.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">{item.sub}</span>
                  </div>
                  <span className="font-mono tabular-nums text-sm text-zinc-900 dark:text-zinc-100">${item.value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-900 dark:bg-zinc-300 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
    return <div className="h-full w-full flex flex-col items-center justify-center space-y-3 py-10"><Activity size={24} className="text-zinc-300 dark:text-zinc-800" /><p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Sin datos</p></div>;
}
