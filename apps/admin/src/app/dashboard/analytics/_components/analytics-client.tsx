"use client";

import { useState } from "react";
import { fetchAnalyticsData } from "../actions";
import { AnalyticsFilters, AnalyticsData, InventoryAnalytics, CategoryPerformance } from "../types";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from "recharts";
import { 
    DollarSign, Percent, TrendingUp, Package, Search, 
    Users, Store, Calendar, ArrowRight, AlertTriangle, 
    Activity, ShoppingBag, Landmark, Scale
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

type FilterOptions = {
    sucursales: { id: string; nombre: string }[];
    usuarios: { id: string; name: string | null; email: string }[];
};

export function AnalyticsClient({ 
    initialData, 
    initialFilters, 
    options,
    initialInventory 
}: { 
    initialData: AnalyticsData, 
    initialFilters: AnalyticsFilters, 
    options: FilterOptions,
    initialInventory: InventoryAnalytics
}) {
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"resumen" | "ventas" | "productos" | "inventario" | "balance">("resumen");

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
      {/* Filters Header (Clean Premium Style) */}
      <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Rango de Fechas</label>
            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
              <input 
                type="date" 
                className="h-11 px-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 font-black text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                value={filters.startDate || ""}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
              <span className="text-zinc-300 font-black">/</span>
              <input 
                type="date" 
                className="h-11 px-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 font-black text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Sucursal</label>
            <select 
              className="h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 font-black text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all appearance-none pr-10 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              value={filters.sucursalId || ""}
              onChange={(e) => handleFilterChange("sucursalId", e.target.value)}
            >
               <option value="">Consolidado Global</option>
               {options.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Cajero / Staff</label>
            <select 
              className="h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 font-black text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all appearance-none pr-10 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
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
            className="h-11 px-6 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? "PROCESANDO..." : "CALCULAR MÉTRICAS"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-rose-700 dark:text-rose-400 shadow-sm animate-in shake duration-500">
          <AlertTriangle size={20} className="shrink-0" />
          <div className="flex flex-col">
            <span className="font-black uppercase text-[10px] tracking-widest">Error de Análisis</span>
            <span className="text-xs font-medium opacity-90 leading-tight">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-zinc-950 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800 shadow-sm">
         <TabButton active={activeTab === "resumen"} onClick={() => setActiveTab("resumen")} icon={<Activity size={14} />}>Resumen Global</TabButton>
         <TabButton active={activeTab === "ventas"} onClick={() => setActiveTab("ventas")} icon={<Store size={14} />}>Sucursales & Staff</TabButton>
         <TabButton active={activeTab === "productos"} onClick={() => setActiveTab("productos")} icon={<ShoppingBag size={14} />}>Rendimiento Mix</TabButton>
         <TabButton active={activeTab === "inventario"} onClick={() => setActiveTab("inventario")} icon={<Package size={14} />}>Activos de Stock</TabButton>
         <TabButton active={activeTab === "balance"} onClick={() => setActiveTab("balance")} icon={<Scale size={14} />}>Balance & Utilidad</TabButton>
         {loading && <div className="ml-4 px-3 py-1 bg-black text-white text-[10px] font-black rounded-lg animate-pulse tracking-widest uppercase">Sincronizando...</div>}
      </div>

      <div className="min-h-[600px] transition-all duration-500">
          {activeTab === "resumen" && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard 
                    title="Ingresos Totales" 
                    value={`$${data.summary.totalRevenue.toLocaleString()}`} 
                    desc="Bruto en el periodo seleccionado"
                    icon={<DollarSign className="text-blue-500" />}
                  />
                  <MetricCard 
                    title="Costo de Venta (COGS)" 
                    value={`$${data.summary.totalCosts.toLocaleString()}`} 
                    desc="Basado en costo histórico"
                    icon={<Package className="text-amber-500" />}
                  />
                  <MetricCard 
                    title="Utilidad Bruta" 
                    value={`$${data.summary.grossProfit.toLocaleString()}`} 
                    desc={`${data.summary.marginPercent.toFixed(1)}% Margen Promedio`}
                    icon={<TrendingUp className="text-emerald-500" />}
                    isPositive={data.summary.grossProfit > 0}
                  />
                   <MetricCard 
                    title="Utilidad Neta" 
                    value={`$${data.summary.netProfit.toLocaleString()}`} 
                    desc="Después de COGS y Operación"
                    icon={<Landmark className="text-zinc-900 dark:text-white" />}
                    isPositive={data.summary.netProfit > 0}
                  />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                   <div className="space-y-1 mb-6 text-zinc-900 dark:text-white">
                      <h3 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase italic leading-none">
                        <TrendingUp size={24} className="text-emerald-500" strokeWidth={3} />
                        Tendencia de Ingresos
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">Flujo de caja monetizado por fecha.</p>
                   </div>
                   
                   <div className="h-[350px] w-full mt-4">
                     {data.dateSales.length === 0 ? <EmptyState /> : (
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={data.dateSales}>
                             <defs>
                               <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.05)" />
                             <XAxis dataKey="date" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
                             <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} fontFamily="monospace" />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff', fontWeight: 'bold' }}
                                formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, "Ingreso"]}
                             />
                             <Area type="monotone" dataKey="totalSales" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                           </AreaChart>
                         </ResponsiveContainer>
                     )}
                   </div>
                 </div>

                 <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                    <div className="space-y-1 mb-6 text-zinc-900 dark:text-white">
                        <h3 className="text-xl font-black tracking-tight uppercase italic leading-none">Categorías</h3>
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">Distribución del volumen.</p>
                    </div>
                    <div className="h-[280px] w-full">
                        {data.categorySales.length === 0 ? <EmptyState /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.categorySales} innerRadius={70} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {data.categorySales.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '10px' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                 </div>
               </div>
             </div>
          )}

          {activeTab === "ventas" && (
             <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in zoom-in-95 duration-500">
               <ListCard 
                  title="Ranking de Sucursales" 
                  desc="Ventas por ubicación física."
                  icon={<Store className="text-zinc-400" size={18} />}
                  items={data.branchSales.map(v => ({ label: v.branchName, value: v.totalSales, sub: `${v.transactionCount} Transacciones`, id: v.branchId }))} 
                  maxVal={data.summary.totalRevenue} 
               />
               <ListCard 
                  title="Productividad por Staff" 
                  desc="Ventas firmadas por usuarios activos."
                  icon={<Users className="text-zinc-400" size={18} />}
                  items={data.userSales.map(v => ({ label: v.userName, value: v.totalSales, sub: `${v.transactionCount} Transacciones`, id: v.userId }))} 
                  maxVal={data.summary.totalRevenue} 
               />
             </div>
          )}

          {activeTab === "productos" && (
             <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10">
                   <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 text-zinc-900 dark:text-white">
                      <ShoppingBag size={24} className="text-zinc-400" />
                      Rendimiento del Mix Comercial
                   </h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left uppercase">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-400 tracking-widest font-black">
                         <tr>
                            <th className="px-8 py-4">Producto</th>
                            <th className="px-8 py-4">Categoría</th>
                            <th className="px-8 py-4 text-right">Volumen</th>
                            <th className="px-8 py-4 text-right">Ingreso Bruto</th>
                            <th className="px-8 py-4 text-right">Margen</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                         {data.topProducts.map((p, idx) => (
                           <tr key={idx} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                              <td className="px-8 py-5 text-zinc-900 dark:text-white font-black text-xs">{p.productName}</td>
                              <td className="px-8 py-5"><span className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-[9px] font-black tracking-widest text-zinc-500 border border-zinc-200 dark:border-zinc-800">{p.category || "General"}</span></td>
                              <td className="px-8 py-5 text-right font-bold text-zinc-500">{p.unitsSold} <span className="text-[9px] font-black opacity-50">PCS</span></td>
                              <td className="px-8 py-5 text-right font-black text-zinc-900 dark:text-white">${p.revenue.toLocaleString()}</td>
                              <td className="px-8 py-5 text-right"><span className="text-emerald-600 dark:text-emerald-400 font-black text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/50">+${p.grossMargin.toLocaleString()}</span></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === "inventario" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <MetricCard title="Valuación a Costo" value={`$${initialInventory.totalValueAtCost.toLocaleString()}`} desc="Valor total del inventario actual" icon={<ShoppingBag className="text-zinc-400" />} />
                     <MetricCard title="Stock Total" value={initialInventory.totalUnits.toLocaleString()} desc="Unidades físicas en sucursales" icon={<Package className="text-zinc-400" />} />
                     <MetricCard title="Quiebre de Stock" value={initialInventory.lowStockItems.toString()} desc="Menos de 5 unidades" icon={<AlertTriangle className="text-red-500" />} isNegative={initialInventory.lowStockItems > 0} />
                     <MetricCard title="Artículos Críticos" value={initialInventory.criticalItems.toString()} desc="Marcados como prioridad" icon={<Activity className="text-blue-500" />} />
                  </div>

                  <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-xl relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />
                    <div className="mb-8 font-black uppercase tracking-tight">Auditoría de Patrimonio</div>
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6 w-full">
                            <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
                                <h4 className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2">Capacidad de Venta Estimada</h4>
                                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Inversión activa disponible para desplazamiento en piso.</p>
                            </div>
                        </div>
                        <div className="w-[200px] h-[200px] shrink-0 relative flex items-center justify-center">
                            <span className="text-5xl font-black text-zinc-900 dark:text-white">85%</span>
                            <svg className="absolute w-full h-full -rotate-90">
                                <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-50 dark:text-zinc-900" />
                                <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="565" strokeDashoffset={565 - (565 * 0.85)} className="text-zinc-900 dark:text-white" />
                            </svg>
                        </div>
                    </div>
                  </div>
              </div>
          )}

          {activeTab === "balance" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <MetricCard title="Margen Operativo" value={`${((data.summary.netProfit / (data.summary.totalRevenue || 1)) * 100).toFixed(1)}%`} icon={<Percent className="text-zinc-400" />} />
                      <MetricCard title="Costo Operativo" value={`$${data.summary.totalExpenses.toLocaleString()}`} icon={<Scale className="text-red-500" />} />
                      <MetricCard title="Utilidad por Transacción" value={`$${(data.summary.netProfit / (data.summary.totalTransactions || 1)).toFixed(2)}`} icon={<DollarSign className="text-emerald-500" />} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
                        <h3 className="text-2xl font-black tracking-tight uppercase italic leading-none mb-6">Desglose de Gastos</h3>
                        <div className="h-[300px] w-full">
                            {data.expensesByCategory.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data.expensesByCategory} innerRadius={80} outerRadius={100} paddingAngle={4} dataKey="value">
                                            {data.expensesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Total']} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                     </div>

                     <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-zinc-900" />
                        <h3 className="text-2xl font-black tracking-tight uppercase italic mb-6">Tendencia de Balance</h3>
                        <div className="h-[300px] w-full">
                            {data.monthlyBalance.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.monthlyBalance}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} fontFamily="monospace" tickFormatter={(val) => val.split(' ')[0]} />
                                        <YAxis axisLine={false} tickLine={false} fontSize={10} fontFamily="monospace" />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                        <Bar dataKey="revenue" fill="#000" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="fixedExpenses" stackId="expenses" fill="#e4e4e7" barSize={20} />
                                        <Bar dataKey="variableExpenses" stackId="expenses" fill="#a1a1aa" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                     </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children, icon }: { active: boolean, onClick: () => void, children: React.ReactNode, icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center gap-2.5", active ? "bg-black text-white shadow-xl scale-[1.02] ring-1 ring-black" : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900")}>
      <span className={cn("transition-transform duration-300", active && "scale-110")}>{icon}</span>
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

function MetricCard({ title, desc, value, icon, isPositive, isNegative }: { title: string, desc?: string, value: string, icon: React.ReactNode, isPositive?: boolean, isNegative?: boolean }) {
  return (
    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
       <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-colors", isPositive ? "bg-emerald-500" : isNegative ? "bg-rose-500" : "bg-zinc-300 dark:bg-zinc-700 group-hover:bg-black dark:group-hover:bg-white")} />
       <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 w-full">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">{title}</p>
              <h3 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none mt-2">{value}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white transition-all">{icon}</div>
       </div>
       {desc && <p className="mt-4 text-[11px] text-zinc-500 font-medium">{desc}</p>}
    </div>
  );
}

function ListCard({ title, desc, items, maxVal, icon }: { title: string, desc: string, items: {label: string, value: number, sub: string, id: string}[], maxVal: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all hover:shadow-xl flex flex-col h-full">
      <div className="p-8 border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg">{icon}</div>
            <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none">{title}</h3>
                <p className="text-zinc-500 font-medium text-xs">{desc}</p>
            </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-8">
          {items.map((item) => {
            const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
            return (
              <div key={item.id} className="space-y-3 group">
                <div className="flex items-end justify-between text-sm">
                  <div className="flex flex-col"><span className="font-black text-zinc-800 uppercase text-xs tracking-tight">{item.label}</span><span className="text-[10px] font-bold text-zinc-400 uppercase leading-none mt-1">{item.sub}</span></div>
                  <span className="font-black text-sm text-zinc-950 underline underline-offset-4 decoration-emerald-200 decoration-4">${item.value.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden border border-zinc-100"><div className="h-full bg-black rounded-full transition-all duration-1000 group-hover:bg-emerald-500" style={{ width: `${percentage}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
    return <div className="h-full w-full flex flex-col items-center justify-center space-y-4 py-20"><Activity size={48} className="text-zinc-200 animate-pulse" /><p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Sin datos registrados</p></div>;
}
