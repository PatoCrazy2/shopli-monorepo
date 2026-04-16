"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { applyAuditAdjustments } from "@/app/dashboard/inventory/actions";
import { CheckCircle2, AlertTriangle, DollarSign, PackageX, History, Loader2, ChevronLeft } from "lucide-react";

type TItem = {
    id: string;
    productId: string;
    productName: string;
    cost: number;
    initialStock: number;
    countedQuantity: number | null;
    countedAt: string | null;
    expectedStock: number | null;
    difference: number | null;
    sales: number;
};

type TAudit = {
    id: string;
    branchName: string;
    status: string;
    isApplied: boolean;
    startedAt: string;
    items: TItem[];
};

export default function AuditReportClient({ audit }: { audit: TAudit }) {
  const [filter, setFilter] = useState<"ALL" | "SHORTAGE" | "SURPLUS" | "MATCH">("ALL");
  const [isPending, startTransition] = useTransition();

  // Filter Items
  const filteredItems = audit.items.filter(item => {
      if (item.difference === null) return filter === "ALL";
      if (filter === "SHORTAGE") return item.difference < 0;
      if (filter === "SURPLUS") return item.difference > 0;
      if (filter === "MATCH") return item.difference === 0;
      return true;
  });

  // KPIs Calculations
  const countedItems = audit.items.filter(i => i.difference !== null);
  const discrepancyItems = countedItems.filter(i => i.difference !== 0);
  const financialImpact = discrepancyItems.reduce((acc, current) => acc + ((current.difference ?? 0) * current.cost), 0);
  const precisionPercentage = countedItems.length > 0 
    ? ((countedItems.length - discrepancyItems.length) / countedItems.length) * 100 
    : 0;

  const handleApply = () => {
    if (!confirm("¿Estás seguro de aplicar estos ajustes? Esto modificará el stock real de la sucursal.")) return;
    
    startTransition(async () => {
        const res = await applyAuditAdjustments(audit.id);
        if (res.error) {
            alert(res.error);
        } else {
            alert("Ajustes aplicados correctamente al inventario.");
        }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/audits"
          className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">Reporte de Auditoría</h1>
          <p className="text-zinc-500 font-medium mt-1">
            Sucursal {audit.branchName} • {new Date(audit.startedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIBox 
          title="Productos con Discrepancia" 
          value={discrepancyItems.length.toString()} 
          subtitle={`de ${countedItems.length} productos contados`}
          icon={<PackageX className="h-5 w-5 text-rose-500" />}
          color="rose"
        />
        <KPIBox 
          title="Impacto Financiero Neto" 
          value={`${financialImpact < 0 ? "-" : "+"}$${Math.abs(financialImpact).toLocaleString()}`} 
          subtitle="Valor de la mercancía desfasada"
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
          color={financialImpact < 0 ? "rose" : "emerald"}
        />
        <KPIBox 
          title="Precisión de Inventario" 
          value={`${precisionPercentage.toFixed(1)}%`} 
          subtitle="Coincidencia con el sistema"
          icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />}
          color="blue"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
         {/* Toolbar */}
         <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
               <FilterBtn active={filter === "ALL"} onClick={() => setFilter("ALL")} label="Todos" />
               <FilterBtn active={filter === "SHORTAGE"} onClick={() => setFilter("SHORTAGE")} label="Faltantes" color="rose" />
               <FilterBtn active={filter === "SURPLUS"} onClick={() => setFilter("SURPLUS")} label="Sobrantes" color="emerald" />
               <FilterBtn active={filter === "MATCH"} onClick={() => setFilter("MATCH")} label="Correctos" />
            </div>

            {audit.status === "CLOSED" && !audit.isApplied && (
                <button 
                    onClick={handleApply} 
                    disabled={isPending}
                    className="w-full md:w-auto px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPending ? "Aplicando..." : "Aplicar Ajustes al Inventario"}
                </button>
            )}
            
            {audit.isApplied && (
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-sm border border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> Ajustes Aplicados
                </div>
            )}
         </div>

         {/* Table */}
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">Producto</th>
                        <th className="px-6 py-4 font-semibold text-zinc-500 text-center uppercase tracking-wider text-[10px]">Stock Inicial</th>
                        <th className="px-6 py-4 font-semibold text-zinc-500 text-center uppercase tracking-wider text-[10px]">Ventas</th>
                        <th className="px-6 py-4 font-bold text-zinc-900 dark:text-white text-center uppercase tracking-wider text-[10px] bg-zinc-100/50 dark:bg-zinc-800/50">Esperado</th>
                        <th className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 text-center uppercase tracking-wider text-[10px] bg-blue-50/30 dark:bg-blue-900/10">Conteo (POS)</th>
                        <th className="px-6 py-4 font-semibold text-zinc-500 text-right uppercase tracking-wider text-[10px]">Diferencia</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredItems.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-20 text-center text-zinc-400 italic">No hay registros que coincidan con el filtro</td>
                        </tr>
                    ) : (
                        filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-zinc-800 dark:text-zinc-200">{item.productName}</td>
                                <td className="px-6 py-4 text-center text-zinc-500">{item.initialStock}</td>
                                <td className="px-6 py-4 text-center">
                                    {item.sales > 0 ? <span className="text-orange-500 font-medium">-{item.sales}</span> : <span className="text-zinc-300">0</span>}
                                </td>
                                <td className="px-6 py-4 text-center font-bold bg-zinc-100/50 dark:bg-zinc-800/50">{item.expectedStock ?? "—"}</td>
                                <td className="px-6 py-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">
                                    {item.countedQuantity ?? "..."}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Badge value={item.difference} />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

function KPIBox({ title, value, subtitle, icon, color }: { title: string, value: string, subtitle: string, icon: React.ReactNode, color: string }) {
    const colorClasses: Record<string, string> = {
        rose: "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50",
        blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50",
    };

    return (
        <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-semibold text-zinc-500">{title}</p>
                <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">{icon}</div>
            </div>
            <h2 className={`text-3xl font-black tracking-tight ${color === 'rose' ? 'text-rose-600' : color === 'emerald' ? 'text-emerald-600' : 'text-zinc-900 dark:text-white'}`}>
                {value}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-medium italic">{subtitle}</p>
        </div>
    );
}

function FilterBtn({ active, onClick, label, color }: { active: boolean, onClick: () => void, label: string, color?: "rose" | "emerald" }) {
    return (
        <button 
            onClick={onClick}
            className={`
                px-4 py-2 text-xs font-bold rounded-lg transition-all
                ${active 
                    ? `bg-white dark:bg-zinc-800 shadow-sm ${color === 'rose' ? 'text-rose-600' : color === 'emerald' ? 'text-emerald-600' : 'text-zinc-900 dark:text-white'}` 
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}
            `}
        >
            {label}
        </button>
    );
}

function Badge({ value }: { value: number | null }) {
    if (value === null) return <span className="text-zinc-300">—</span>;
    
    const isNegative = value < 0;
    const isPositive = value > 0;

    return (
        <span className={`
            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black
            ${isNegative ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30" : 
              isPositive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" : 
              "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}
        `}>
            {isPositive ? "+" : ""}{value}
        </span>
    );
}
