"use client";

import { useState, useEffect, useRef } from "react";
import { fetchAnalyticsData } from "../actions";
import { AnalyticsFilters, AnalyticsData } from "../types";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
    AlertTriangle, Activity, ShoppingBag, Landmark, Store, Users
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
  const [preset, setPreset] = useState<"hoy" | "7d" | "30d" | "ytd" | "todo">("todo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"finanzas" | "operaciones" | "catalogo">("finanzas");

  const isFirstRender = useRef(true);

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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadData();
  }, [filters]);

  const handleFilterChange = (key: keyof AnalyticsFilters, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val || undefined }));
  };

  const handlePreset = (p: "hoy" | "7d" | "30d" | "ytd" | "todo") => {
    setPreset(p);
    const now = new Date();
    if (p === "todo") {
      setFilters(prev => ({ ...prev, startDate: undefined, endDate: undefined }));
    } else if (p === "hoy") {
      const today = now.toISOString().split("T")[0];
      setFilters(prev => ({ ...prev, startDate: today, endDate: today }));
    } else if (p === "7d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      setFilters(prev => ({ ...prev, startDate: d.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] }));
    } else if (p === "30d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      setFilters(prev => ({ ...prev, startDate: d.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] }));
    } else if (p === "ytd") {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      setFilters(prev => ({ ...prev, startDate: start, endDate: now.toISOString().split("T")[0] }));
    }
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Vercel-style Command Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg w-fit border border-zinc-200 dark:border-zinc-800 overflow-x-auto hide-scrollbar max-w-full">
           <TabButton active={activeTab === "finanzas"} onClick={() => setActiveTab("finanzas")} icon={<Landmark size={12} />}>Finanzas</TabButton>
           <TabButton active={activeTab === "operaciones"} onClick={() => setActiveTab("operaciones")} icon={<Activity size={12} />}>Operaciones</TabButton>
           <TabButton active={activeTab === "catalogo"} onClick={() => setActiveTab("catalogo")} icon={<ShoppingBag size={12} />}>Catálogo</TabButton>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full xl:w-auto">
          <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
            <PresetButton active={preset === "hoy"} onClick={() => handlePreset("hoy")}>Hoy</PresetButton>
            <PresetButton active={preset === "7d"} onClick={() => handlePreset("7d")}>7d</PresetButton>
            <PresetButton active={preset === "30d"} onClick={() => handlePreset("30d")}>30d</PresetButton>
            <PresetButton active={preset === "ytd"} onClick={() => handlePreset("ytd")}>YTD</PresetButton>
            <PresetButton active={preset === "todo"} onClick={() => handlePreset("todo")}>Todo</PresetButton>
          </div>

          <select 
            className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all appearance-none pr-7 relative dark:bg-zinc-900 dark:border-zinc-800 shrink-0"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}
            value={filters.sucursalId || ""}
            onChange={(e) => handleFilterChange("sucursalId", e.target.value)}
          >
             <option value="">Sucursal: Todas</option>
             {options.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          
          <select 
            className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all appearance-none pr-7 relative dark:bg-zinc-900 dark:border-zinc-800 shrink-0"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '12px' }}
            value={filters.usuarioId || ""}
            onChange={(e) => handleFilterChange("usuarioId", e.target.value)}
          >
             <option value="">Staff: Todos</option>
             {options.usuarios.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>

          {loading && (
            <div className="shrink-0 ml-1">
              <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="text-xs font-mono font-medium">{error}</span>
        </div>
      )}

      <div className="min-h-[500px] transition-all duration-300">
          {activeTab === "finanzas" && (
             <div className="space-y-6 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard 
                    title="Ingreso Bruto" 
                    value={`$${data.summary.totalRevenue.toLocaleString()}`} 
                  />
                  <MetricCard 
                    title="Costo de Venta" 
                    value={`$${data.summary.totalCosts.toLocaleString()}`} 
                  />
                  <MetricCard 
                    title="Utilidad Bruta" 
                    value={`$${data.summary.grossProfit.toLocaleString()}`} 
                    delta={{ value: `${data.summary.marginPercent.toFixed(1)}%`, text: "margen bruto" }}
                    polarity={data.summary.grossProfit >= 0 ? "positive" : "negative"}
                  />
                   <MetricCard 
                    title="Utilidad Neta" 
                    value={`$${data.summary.netProfit.toLocaleString()}`} 
                    desc={`-$${data.summary.totalExpenses.toLocaleString()} ops`}
                    polarity={data.summary.netProfit >= 0 ? "positive" : "negative"}
                  />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-[360px]">
                   <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-[11px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">Flujo de Ingresos</h3>
                   </div>
                   <div className="w-full flex-1">
                     {data.dateSales.length === 0 ? <EmptyState /> : (
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={data.dateSales}>
                             <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
                             <XAxis dataKey="date" stroke="currentColor" className="text-zinc-400" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                             <YAxis stroke="currentColor" className="text-zinc-400" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} fontFamily="monospace" width={50} />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, "Ingreso"]}
                             />
                             <Area type="monotone" dataKey="totalSales" stroke="#18181b" strokeWidth={2} fillOpacity={0.05} fill="#18181b" className="dark:stroke-zinc-300 dark:fill-zinc-300" />
                           </AreaChart>
                         </ResponsiveContainer>
                     )}
                   </div>
                 </div>

                 <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-[360px]">
                    <div className="mb-6">
                        <h3 className="text-[11px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">Desglose de Gastos</h3>
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
                                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#fff' }}
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
             <div className="space-y-6 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricCard title="Transacciones" value={data.summary.totalTransactions.toLocaleString()} />
                  <MetricCard title="Ticket Promedio" value={`$${data.summary.averageTicket.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
                  <MetricCard title="Sucursales Activas" value={data.branchSales.length.toString()} />
               </div>

               <div className="grid gap-6 lg:grid-cols-2">
                 <ListCard 
                    title="Rendimiento por Sucursal" 
                    icon={<Store size={14} />}
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
                    icon={<Users size={14} />}
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
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-900">
                   <h3 className="text-[11px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <ShoppingBag size={14} className="text-zinc-400" />
                      Rentabilidad del Mix Comercial
                   </h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-500 tracking-widest uppercase font-bold">
                         <tr>
                            <th className="px-5 py-3">Producto</th>
                            <th className="px-5 py-3">Categoría</th>
                            <th className="px-5 py-3 text-right">Volumen</th>
                            <th className="px-5 py-3 text-right">Ingreso Bruto</th>
                            <th className="px-5 py-3 text-right">Margen Bruto</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                         {data.topProducts.map((p, idx) => (
                           <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                              <td className="px-5 py-3 text-zinc-900 dark:text-zinc-100 font-medium text-xs">{p.productName}</td>
                              <td className="px-5 py-3">
                                <span className="text-[9px] uppercase tracking-widest text-zinc-500">{p.category || "General"}</span>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-xs text-zinc-600 dark:text-zinc-400">{p.unitsSold}</td>
                              <td className="px-5 py-3 text-right font-mono text-xs text-zinc-900 dark:text-zinc-100">${p.revenue.toLocaleString()}</td>
                              <td className="px-5 py-3 text-right font-mono text-xs">
                                <span className={cn(p.grossMargin >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500")}>
                                  {p.grossMargin >= 0 ? "+" : "-"}${Math.abs(p.grossMargin).toLocaleString()}
                                </span>
                              </td>
                           </tr>
                         ))}
                         {data.topProducts.length === 0 && (
                           <tr><td colSpan={5} className="px-5 py-10 text-center text-xs font-mono uppercase tracking-widest text-zinc-400">Sin datos</td></tr>
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

function PresetButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "px-3 py-1 text-[11px] font-mono tracking-tight transition-all rounded-md whitespace-nowrap outline-none", 
      active ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
    )}>
      {children}
    </button>
  );
}

function TabButton({ active, onClick, children, icon }: { active: boolean, onClick: () => void, children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all rounded-md flex items-center gap-1.5 whitespace-nowrap outline-none", 
      active ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
    )}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

function MetricCard({ title, desc, value, polarity, delta }: { title: string, desc?: string, value: string, polarity?: "positive" | "negative", delta?: { value: string, text: string } }) {
  return (
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-24">
       <div className="flex justify-between items-start mb-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{title}</p>
       </div>
       <div>
         <h3 className="text-2xl font-mono tabular-nums tracking-tight leading-none mb-1 text-zinc-900 dark:text-white">
           {value}
         </h3>
         
         {delta ? (
           <div className="flex items-center gap-1.5 mt-1">
             <span className={cn(
               "px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight",
               delta.value.startsWith("+") || polarity === "positive" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
               delta.value.startsWith("-") || polarity === "negative" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
               "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
             )}>{delta.value}</span>
             <span className="text-[10px] text-zinc-400 font-mono tracking-tight">{delta.text}</span>
           </div>
         ) : desc ? (
           <p className="mt-1 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{desc}</p>
         ) : null}
       </div>
    </div>
  );
}

function ListCard({ title, items, maxVal, icon }: { title: string, items: {label: string, value: number, sub: string, id: string}[], maxVal: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[340px]">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-2">
         <div className="text-zinc-400">{icon}</div>
         <h3 className="text-[11px] font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{title}</h3>
      </div>
      <div className="p-5 flex-1 overflow-y-auto">
        <div className="space-y-5">
          {items.length === 0 ? <EmptyState /> : items.map((item) => {
            const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 text-xs truncate max-w-[150px] sm:max-w-[200px]">{item.label}</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{item.sub}</span>
                  </div>
                  <span className="font-mono tabular-nums text-xs text-zinc-900 dark:text-zinc-100">${item.value.toLocaleString()}</span>
                </div>
                <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
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
    return <div className="h-full w-full flex flex-col items-center justify-center space-y-2 py-8"><Activity size={20} className="text-zinc-300 dark:text-zinc-800" /><p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Sin datos</p></div>;
}
