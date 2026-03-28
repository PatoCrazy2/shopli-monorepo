"use client";

import { useState } from "react";
import { fetchAnalyticsData } from "../actions";
import { AnalyticsFilters, AnalyticsData, InventoryAnalytics } from "../types";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
    DollarSign, Percent, TrendingUp, Package, Search, 
    Users, Store, Calendar, ArrowRight, AlertTriangle, 
    Activity, ShoppingBag
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
  const [activeTab, setActiveTab] = useState<"resumen" | "ventas" | "productos" | "inventario">("resumen");

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
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
             <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 flex items-center gap-1.5 px-1">
                   Rango de Fechas
                </label>
                <div className="flex items-center gap-2">
                   <input 
                     type="date" 
                     className="w-full text-sm h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-black outline-none font-bold transition-all"
                     value={filters.startDate || ""}
                     onChange={(e) => handleFilterChange("startDate", e.target.value)}
                   />
                   <ArrowRight size={14} className="text-zinc-300 shrink-0" />
                   <input 
                     type="date" 
                     className="w-full text-sm h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-black outline-none font-bold transition-all"
                     value={filters.endDate || ""}
                     onChange={(e) => handleFilterChange("endDate", e.target.value)}
                   />
                </div>
             </div>
             
             <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 flex items-center gap-1.5 px-1">
                   Sucursal
                </label>
                <select 
                  className="w-full text-sm h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-black outline-none font-bold appearance-none transition-all"
                  value={filters.sucursalId || ""}
                  onChange={(e) => handleFilterChange("sucursalId", e.target.value)}
                >
                   <option value="">Consolidado Global</option>
                   {options.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
             </div>
             
             <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 flex items-center gap-1.5 px-1">
                   Cajero / Staff
                </label>
                <select 
                  className="w-full text-sm h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-black outline-none font-bold appearance-none transition-all"
                  value={filters.usuarioId || ""}
                  onChange={(e) => handleFilterChange("usuarioId", e.target.value)}
                >
                   <option value="">Todos los Usuarios</option>
                   {options.usuarios.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                </select>
             </div>
 
             <div className="flex items-end pt-5">
                <button 
                  onClick={loadData}
                  disabled={loading}
                  className="w-full h-11 bg-black text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
                >
                  <Search size={16} strokeWidth={3} />
                  {loading ? "PROCESANDO..." : "CALCULAR MÉTRICAS"}
                </button>
             </div>
          </div>
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
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800 shadow-sm">
         <TabButton active={activeTab === "resumen"} onClick={() => setActiveTab("resumen")} icon={<Activity size={14} />}>Resumen Global</TabButton>
         <TabButton active={activeTab === "ventas"} onClick={() => setActiveTab("ventas")} icon={<Store size={14} />}>Sucursales & Personal</TabButton>
         <TabButton active={activeTab === "productos"} onClick={() => setActiveTab("productos")} icon={<ShoppingBag size={14} />}>Ventas x Producto</TabButton>
         <TabButton active={activeTab === "inventario"} onClick={() => setActiveTab("inventario")} icon={<Package size={14} />}>Estado de Stock</TabButton>
         {loading && <div className="ml-4 px-3 py-1 bg-black text-white text-[10px] font-black rounded-lg animate-pulse">CARGANDO...</div>}
         {!loading && data.summary.totalTransactions > 0 && (
           <div className="ml-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-100 dark:border-emerald-900 tracking-tighter shadow-sm">
             {data.summary.totalTransactions} VENTAS
           </div>
         )}
      </div>

      <div className="min-h-[600px] transition-all duration-500">
          {activeTab === "resumen" && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               {/* Metric Cards Grid */}
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
                    title="Ticket Promedio" 
                    value={`$${data.summary.averageTicket.toFixed(2)}`} 
                    desc={`${data.summary.totalTransactions} Ventas realizadas`}
                    icon={<Percent className="text-indigo-500" />}
                  />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Main Revenue Chart */}
                 <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                   <div className="space-y-1 mb-6 text-zinc-900 dark:text-white">
                      <h3 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase italic leading-none">
                        <TrendingUp size={24} className="text-emerald-500" strokeWidth={3} />
                        Tendencia de Ingresos
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">Flujo de caja monetizado por fecha.</p>
                   </div>
                   
                   <div className="h-[350px] w-full mt-4">
                     {data.dateSales.length === 0 ? (
                         <EmptyState />
                     ) : (
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={data.dateSales}>
                             <defs>
                               <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.05)" />
                             <XAxis 
                               dataKey="date" 
                               stroke="#a1a1aa" 
                               fontSize={10} 
                               tickLine={false} 
                               axisLine={false} 
                               tickFormatter={(v) => v.split('-').slice(1).join('/')}
                               fontFamily="monospace"
                             />
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

                 {/* Categorias Pie Chart */}
                 <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                    <div className="space-y-1 mb-6 text-zinc-900 dark:text-white">
                        <h3 className="text-xl font-black tracking-tight uppercase italic leading-none">Categorías</h3>
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">Distribución del volumen.</p>
                    </div>
                    <div className="h-[280px] w-full">
                        {data.categorySales.length === 0 ? <EmptyState /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.categorySales}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {data.categorySales.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
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
                  items={data.branchSales.map(v => ({ 
                    label: v.branchName, 
                    value: v.totalSales, 
                    sub: `${v.transactionCount} Transacciones`,
                    id: v.branchId
                  }))} 
                  maxVal={data.summary.totalRevenue} 
               />
               <ListCard 
                  title="Productividad por Staff" 
                  desc="Ventas firmadas por usuarios activos."
                  icon={<Users className="text-zinc-400" size={18} />}
                  items={data.userSales.map(v => ({ 
                    label: v.userName, 
                    value: v.totalSales, 
                    sub: `${v.transactionCount} Transacciones`,
                    id: v.userId
                  }))} 
                  maxVal={data.summary.totalRevenue} 
               />
             </div>
          )}

          {activeTab === "productos" && (
             <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/30 dark:bg-white/[0.02]">
                   <h3 className="text-xl font-black tracking-tight flex items-center gap-3 italic uppercase">
                      <ShoppingBag size={22} className="text-emerald-500" strokeWidth={3} />
                      Rendimiento de Productos
                   </h3>
                   <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1.5">Análisis de rentabilidad basado en ventas completadas.</p>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead>
                         <tr className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] bg-zinc-50/50 dark:bg-white/[0.02] font-black border-b border-zinc-100 dark:border-zinc-900">
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4 text-right">Volumen</th>
                            <th className="px-6 py-4 text-right">Ingreso Bruto</th>
                            <th className="px-6 py-4 text-right">Margen</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                         {data.topProducts.map((p, idx) => (
                           <tr key={idx} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 text-zinc-900 dark:text-white font-black uppercase text-xs tracking-tight">
                                {p.productName}
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                                    {p.category || "General"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-zinc-500 font-black">{p.unitsSold} <span className="text-[9px]">UND</span></td>
                              <td className="px-6 py-4 text-right font-black text-zinc-950 dark:text-zinc-100 underline decoration-zinc-100 underline-offset-4 decoration-1">${p.revenue.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                 <span className="text-emerald-500 font-black text-xs ring-1 ring-emerald-100 px-2 py-0.5 rounded-lg bg-emerald-50/50">
                                   +${p.grossMargin.toLocaleString()}
                                 </span>
                              </td>
                           </tr>
                         ))}
                         {data.topProducts.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-black uppercase tracking-widest text-xs">Sin registros financieros</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === "inventario" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <MetricCard 
                       title="Valuación a Costo" 
                       value={`$${initialInventory.totalValueAtCost.toLocaleString()}`} 
                       desc="Valor total del inventario actual"
                       icon={<ShoppingBag className="text-zinc-400" />}
                     />
                     <MetricCard 
                       title="Stock Total" 
                       value={initialInventory.totalUnits.toLocaleString()} 
                       desc="Unidades físicas en sucursales"
                       icon={<Package className="text-zinc-400" />}
                     />
                     <MetricCard 
                       title="Quiebre de Stock" 
                       value={initialInventory.lowStockItems.toString()} 
                       desc="Productos con menos de 5 unidades"
                       icon={<AlertTriangle className="text-red-500" />}
                       isNegative={initialInventory.lowStockItems > 0}
                     />
                     <MetricCard 
                       title="Artículos Críticos" 
                       value={initialInventory.criticalItems.toString()} 
                       desc="Productos marcados como prioridad"
                       icon={<Activity className="text-blue-500" />}
                     />
                  </div>

                  <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-6">
                        <h3 className="text-xl font-black tracking-tight uppercase italic leading-none">Auditoría de Patrimonio</h3>
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mt-1.5">Resumen de activos circulantes.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 space-y-4">
                            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                                <h4 className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Capacidad de Venta Estimada</h4>
                                <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 font-medium">
                                    Este valor representa lo que has invertido en mercancía que está lista para ser vendida.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5">
                                    <span className="text-[10px] text-zinc-400 font-black uppercase block mb-1 tracking-widest">Items Únicos</span>
                                    <span className="text-2xl font-black text-zinc-900 dark:text-white leading-none">{data.topProducts.length}</span>
                                </div>
                                <div className="p-4 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl border border-rose-200 dark:border-rose-900/40">
                                    <span className="text-[10px] text-rose-400 font-black uppercase block mb-1 tracking-widest">En Alerta</span>
                                    <span className="text-2xl font-black text-rose-600 leading-none">{initialInventory.lowStockItems}</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-[260px] h-[260px] shrink-0 relative flex items-center justify-center">
                            <div className="absolute inset-x-0 bottom-4 text-center">
                                <span className="text-4xl font-black text-zinc-950 dark:text-white block leading-none">
                                    {((initialInventory.totalUnits / (initialInventory.totalUnits + 10)) * 100).toFixed(0)}%
                                </span>
                                <span className="text-[9px] font-black text-zinc-400 uppercase mt-2 block tracking-[0.3em]">
                                    Salud de Stock
                                </span>
                            </div>
                            <svg className="absolute w-full h-full -rotate-90">
                                <circle cx="130" cy="130" r="110" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-50 dark:text-zinc-900" />
                                <circle cx="130" cy="130" r="110" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="691" strokeDashoffset={691 - (691 * 0.85)} className="text-zinc-950 dark:text-white stroke-round shadow-lg" />
                            </svg>
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
    <button 
      onClick={onClick}
      className={cn(
        "px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl flex items-center gap-2",
        active 
          ? "bg-black text-white shadow-lg scale-[1.02]" 
          : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-white/5"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

function MetricCard({ title, desc, value, icon, isPositive, isNegative }: { 
    title: string, 
    desc?: string, 
    value: string, 
    icon: React.ReactNode,
    isPositive?: boolean,
    isNegative?: boolean
}) {
  return (
    <div className={cn(
      "bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:shadow-md transition-all hover:-translate-y-1",
      isNegative && "border-rose-200 bg-rose-50/30",
      isPositive && "border-emerald-200 bg-emerald-50/30"
    )}>
       <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 w-full">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">{value}</h3>
              </div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 group-hover:scale-110 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm">
              {icon}
          </div>
       </div>
       {desc && (
         <p className="mt-4 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
           {desc}
         </p>
       )}
    </div>
  );
}

function ListCard({ title, desc, items, maxVal, icon }: { title: string, desc: string, items: {label: string, value: number, sub: string, id: string}[], maxVal: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all hover:shadow-md h-full">
      <div className="p-6 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/30">
        <div className="flex items-center gap-3">
            {icon}
            <div>
                <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic leading-none">{title}</h3>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1.5">{desc}</p>
            </div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-8">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
             items.map((item) => {
               const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
               return (
                 <div key={item.id} className="space-y-3 group">
                   <div className="flex items-end justify-between text-sm">
                     <div className="flex flex-col">
                        <span className="font-black text-zinc-800 dark:text-zinc-100 uppercase text-xs tracking-tight group-hover:text-black transition-colors">
                            {item.label}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">{item.sub}</span>
                     </div>
                     <span className="font-black text-sm text-zinc-950 dark:text-white underline underline-offset-4 decoration-emerald-200 decoration-4">
                       ${item.value.toLocaleString()}
                     </span>
                   </div>
                   <div className="h-2 w-full bg-zinc-50 dark:bg-white/5 rounded-full overflow-hidden shadow-inner border border-zinc-100 dark:border-zinc-900">
                       <div 
                         className="h-full bg-black dark:bg-white rounded-full transition-all duration-1000 ease-out group-hover:bg-emerald-500" 
                         style={{ width: `${percentage}%` }}
                       />
                   </div>
                 </div>
               );
             })
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center space-y-4 py-20">
            <Activity size={48} className="text-zinc-200 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Sin datos registrados</p>
        </div>
    );
}
