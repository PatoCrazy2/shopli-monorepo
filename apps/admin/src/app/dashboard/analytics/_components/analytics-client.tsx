"use client";

import { useState } from "react";
import { fetchAnalyticsData } from "../actions";
import { AnalyticsFilters, AnalyticsData, InventoryAnalytics } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/card";
import { Progress } from "@repo/ui/progress";
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
    DollarSign, Percent, TrendingUp, Package, Search, 
    Users, Store, Calendar, ArrowRight, AlertTriangle, 
    Activity, ChevronRight, ShoppingBag
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 pb-10">
      {/* Search Header / Filters */}
      <div className="relative group overflow-hidden rounded-2xl border border-white/10 p-0.5 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-[15px] p-6 flex flex-col md:flex-row justify-between items-end gap-6 shadow-2xl">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                   <Calendar size={12} className="text-blue-500" />
                   Rango de Fechas
                </label>
                <div className="flex items-center gap-2">
                   <input 
                     type="date" 
                     className="w-full text-xs p-2.5 border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500/20 outline-none"
                     value={filters.startDate || ""}
                     onChange={(e) => handleFilterChange("startDate", e.target.value)}
                   />
                   <ArrowRight size={14} className="text-zinc-400 shrink-0" />
                   <input 
                     type="date" 
                     className="w-full text-xs p-2.5 border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500/20 outline-none"
                     value={filters.endDate || ""}
                     onChange={(e) => handleFilterChange("endDate", e.target.value)}
                   />
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                   <Store size={12} className="text-emerald-500" />
                   Sucursal
                </label>
                <select 
                  className="w-full text-xs p-2.5 border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                  value={filters.sucursalId || ""}
                  onChange={(e) => handleFilterChange("sucursalId", e.target.value)}
                >
                   <option value="">Consolidado Global</option>
                   {options.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
             </div>
             
             <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                   <Users size={12} className="text-amber-500" />
                   Usuario / Cajero
                </label>
                <select 
                  className="w-full text-xs p-2.5 border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50/50 dark:bg-white/5 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                  value={filters.usuarioId || ""}
                  onChange={(e) => handleFilterChange("usuarioId", e.target.value)}
                >
                   <option value="">Todos los Usuarios</option>
                   {options.usuarios.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                </select>
             </div>

             <div className="flex items-end">
                <button 
                  onClick={loadData}
                  disabled={loading}
                  className="w-full h-[38px] bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Search size={14} />
                  {loading ? "PROCESANDO..." : "CALCULAR MÉTRICAS"}
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-sm text-red-700 dark:text-red-400">
          <AlertTriangle size={18} className="shrink-0" />
          <div>
            <span className="font-bold block">Error al cargar datos de analytics</span>
            <span className="text-xs opacity-80">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100/50 dark:bg-white/5 rounded-2xl w-fit border border-black/5 dark:border-white/5">
         <TabButton active={activeTab === "resumen"} onClick={() => setActiveTab("resumen")} icon={<Activity size={14} />}>Dashboard Central</TabButton>
         <TabButton active={activeTab === "ventas"} onClick={() => setActiveTab("ventas")} icon={<Store size={14} />}>Sucursales & Staff</TabButton>
         <TabButton active={activeTab === "productos"} onClick={() => setActiveTab("productos")} icon={<ShoppingBag size={14} />}>Ventas por Producto</TabButton>
         <TabButton active={activeTab === "inventario"} onClick={() => setActiveTab("inventario")} icon={<Package size={14} />}>Estado de Inventario</TabButton>
         {loading && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-blue-500 animate-pulse">Cargando...</span>}
         {!loading && data.summary.totalTransactions > 0 && (
           <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full">
             {data.summary.totalTransactions} ventas
           </span>
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
                 <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-white dark:bg-zinc-950">
                   <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Activity size={120} />
                   </div>
                   <CardHeader>
                     <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" />
                        Tendencia de Ingresos Diarios
                     </CardTitle>
                     <CardDescription>Flujo de caja monetizado por fecha.</CardDescription>
                   </CardHeader>
                   <CardContent>
                      <div className="h-[350px] w-full mt-4">
                        {data.dateSales.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={data.dateSales}>
                                <defs>
                                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis 
                                  dataKey="date" 
                                  stroke="#888888" 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={false} 
                                  tickFormatter={(v) => v.split('-').slice(1).join('/')}
                                />
                                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                                  formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Ingreso"]}
                                />
                                <Area type="monotone" dataKey="totalSales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                              </AreaChart>
                            </ResponsiveContainer>
                        )}
                      </div>
                   </CardContent>
                 </Card>

                 {/* Categorias Pie Chart */}
                 <Card className="border-none shadow-xl bg-white dark:bg-zinc-950">
                    <CardHeader>
                        <CardTitle className="text-lg">Ventas por Categoría</CardTitle>
                        <CardDescription>Distribución del volumen de ingreso.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full">
                            {data.categorySales.length === 0 ? <EmptyState /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.categorySales}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.categorySales.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="mt-4 space-y-2">
                            {data.categorySales.slice(0, 3).map((cat, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                    </span>
                                    <span className="font-semibold">${cat.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                 </Card>
               </div>
             </div>
          )}

          {activeTab === "ventas" && (
             <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in zoom-in-95 duration-500">
               <ListCard 
                  title="Ranking de Sucursales" 
                  desc="Consolidado de ventas por ubicación física."
                  icon={<Store className="text-blue-500" size={18} />}
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
                  icon={<Users className="text-emerald-500" size={18} />}
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
             <Card className="animate-in fade-in duration-500 border-none shadow-2xl overflow-hidden bg-white dark:bg-zinc-950">
                <CardHeader className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-100 dark:border-white/5">
                   <CardTitle className="flex items-center gap-2 text-lg">
                      <ShoppingBag size={20} className="text-amber-500" />
                      Rendimiento de Productos (Top 15)
                   </CardTitle>
                   <CardDescription>Análisis de rentabilidad basado en el FIFO de precios históricos.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto p-0">
                   <table className="w-full text-sm text-left">
                      <thead className="text-[10px] text-muted-foreground uppercase tracking-widest bg-zinc-50/50 dark:bg-white/5 font-bold">
                         <tr>
                            <th className="px-6 py-5">Producto</th>
                            <th className="px-6 py-5">Categoría</th>
                            <th className="px-6 py-5 text-right">Volumen</th>
                            <th className="px-6 py-5 text-right">Ingreso Bruto</th>
                            <th className="px-6 py-5 text-right">Margen Neto</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                         {data.topProducts.map((p, idx) => (
                           <tr key={idx} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-default">
                              <td className="px-6 py-4">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors uppercase text-xs tracking-tight">
                                    {p.productName}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-500">
                                    {p.category || "General"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-zinc-500">{p.unitsSold} <span className="text-[10px]">UND</span></td>
                              <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-zinc-200">${p.revenue.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex flex-col items-end">
                                    <span className="text-emerald-500 font-bold">+${p.grossMargin.toLocaleString()}</span>
                                    <span className="text-[10px] text-muted-foreground">Utilidad</span>
                                 </div>
                              </td>
                           </tr>
                         ))}
                         {data.topProducts.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium uppercase tracking-widest text-xs">Sin registros financieros</td></tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </Card>
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

                  <Card className="border-none shadow-xl bg-white dark:bg-zinc-950">
                    <CardHeader>
                        <CardTitle>Auditoría de Patrimonio</CardTitle>
                        <CardDescription>Resumen de activos circulantes (inventario mercancía).</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 space-y-4">
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Capacidad de Venta Estimada</h4>
                                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                    Este valor representa lo que has invertido en mercancía que está lista para ser vendida.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Items Únicos</span>
                                    <span className="text-xl font-bold">{data.topProducts.length}</span>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">En Alerta</span>
                                    <span className="text-xl font-bold text-red-500">{initialInventory.lowStockItems}</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-[300px] h-[300px] shrink-0 relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
                            <div className="relative text-center">
                                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white block">
                                    {((initialInventory.totalUnits / (initialInventory.totalUnits + 10)) * 100).toFixed(0)}%
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase mt-2 block tracking-widest">
                                    Nivel Salud Salud
                                </span>
                            </div>
                            <svg className="absolute w-full h-full -rotate-90">
                                <circle cx="150" cy="150" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                                <circle cx="150" cy="150" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="753.9" strokeDashoffset={753.9 - (753.9 * 0.8)} className="text-blue-500 stroke-round" />
                            </svg>
                        </div>
                    </CardContent>
                  </Card>
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
        "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-xl flex items-center gap-2",
        active 
          ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

function MetricCard({ title, desc, value, icon, trend, isPositive, isNegative }: { 
    title: string, 
    desc?: string, 
    value: string, 
    icon: React.ReactNode,
    trend?: number,
    isPositive?: boolean,
    isNegative?: boolean
}) {
  return (
    <Card className="border-none shadow-xl bg-white dark:bg-zinc-950 group hover:-translate-y-1 transition-all duration-300">
      <CardContent className="pt-6">
         <div className="flex justify-between items-start">
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                <h3 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{value}</h3>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/5 group-hover:scale-110 transition-transform">
                {icon}
            </div>
         </div>
         <div className="mt-4 flex items-center justify-between">
            {desc && <p className="text-[10px] text-zinc-400 font-medium">{desc}</p>}
            {trend && (
                <div className={cn(
                    "px-1.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1",
                    trend > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                )}>
                    {trend > 0 ? "+" : ""}{trend}%
                </div>
            )}
            {isNegative !== undefined && isNegative && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
         </div>
      </CardContent>
    </Card>
  );
}

function ListCard({ title, desc, items, maxVal, icon }: { title: string, desc: string, items: {label: string, value: number, sub: string, id: string}[], maxVal: number, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden">
      <CardHeader className="border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center gap-3">
            {icon}
            <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-xs">{desc}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-8">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
             items.map((item, idx) => {
               const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
               return (
                 <div key={item.id} className="space-y-3 group">
                   <div className="flex items-end justify-between text-sm">
                     <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-xs tracking-tight group-hover:text-blue-500 transition-colors">
                            {item.label}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">{item.sub}</span>
                     </div>
                     <span className="font-mono text-xs font-bold">${item.value.toLocaleString()}</span>
                   </div>
                   <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-500 rounded-full group-hover:bg-emerald-500 transition-all duration-500" 
                         style={{ width: `${percentage}%` }}
                       />
                   </div>
                 </div>
               );
             })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center space-y-4 py-20 opacity-40">
            <Activity size={48} className="text-zinc-300" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Sin datos registrados</p>
        </div>
    );
}
