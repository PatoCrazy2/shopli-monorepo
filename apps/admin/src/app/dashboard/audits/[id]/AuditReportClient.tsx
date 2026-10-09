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
    hasAdjustments?: boolean;
    startedAt: string;
    finishedAt?: string | null;
    startedBy?: string;
    finishedBy?: string;
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
    <div className="flex flex-col gap-6">
      {/* 1. Header Card (Estilo ShopLI / Apple Crisp con Breadcrumbs) */}
      <div className="bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            {/* Breadcrumb de navegación */}
            <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs">
              <Link
                href="/dashboard/audits"
                className="inline-flex items-center gap-1 font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Auditorías</span>
              </Link>
              <span>/</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {audit.branchName}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                Reporte de Auditoría
              </h1>

              {/* Badges de Estado Sutiles */}
              {audit.isApplied ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Conciliado</span>
                </span>
              ) : audit.status === "CLOSED" ? (
                discrepancyItems.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Pdte. Ajuste</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Sin Diferencias</span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span>En Curso</span>
                </span>
              )}

              {audit.hasAdjustments && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700" title="Esta auditoría registró ajustes retroactivos por ventas tardías">
                  <History className="w-3 h-3 text-zinc-400" />
                  <span>Reconciliada</span>
                </span>
              )}
            </div>

            {/* Metadatos de Trazabilidad */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
              <span>Sucursal <strong className="font-semibold text-zinc-700 dark:text-zinc-300">{audit.branchName}</strong></span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span>Iniciada el {new Date(audit.startedAt).toLocaleDateString()} a las {new Date(audit.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{audit.startedBy ? ` por ${audit.startedBy}` : ''}</span>
              {audit.finishedAt && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span>Finalizada a las {new Date(audit.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{audit.finishedBy ? ` por ${audit.finishedBy}` : ''}</span>
                </>
              )}
            </div>
          </div>

          {/* Botón Volver al Listado */}
          <div className="shrink-0">
            <Link
              href="/dashboard/audits"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
              <span>Volver a auditorías</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KPIs Monocromáticos (Estilo Apple Crisp) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <KPIBox 
          title="Productos con Discrepancia" 
          value={discrepancyItems.length.toString()} 
          subtitle={`de ${countedItems.length} productos contados`}
          icon={<PackageX className="h-4 w-4 text-zinc-400" />}
          hasAlert={discrepancyItems.length > 0}
        />
        <KPIBox 
          title="Impacto Financiero Neto" 
          value={`${financialImpact < 0 ? "-" : "+"}$${Math.abs(financialImpact).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          subtitle="Valor monetario del desfase"
          icon={<DollarSign className="h-4 w-4 text-zinc-400" />}
          isNegative={financialImpact < 0}
        />
        <KPIBox 
          title="Precisión de Inventario" 
          value={`${precisionPercentage.toFixed(1)}%`} 
          subtitle="Coincidencia con existencias del sistema"
          icon={<CheckCircle2 className="h-4 w-4 text-zinc-400" />}
        />
      </div>

      {/* 3. Tabla Principal con Toolbar */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
         {/* Toolbar de Píldoras de Filtro y Acciones */}
         <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-0.5">
               <FilterPill 
                 active={filter === "ALL"} 
                 onClick={() => setFilter("ALL")} 
                 label="Todos" 
                 count={audit.items.length} 
               />
               <FilterPill 
                 active={filter === "SHORTAGE"} 
                 onClick={() => setFilter("SHORTAGE")} 
                 label="Faltantes" 
                 count={countedItems.filter(i => (i.difference ?? 0) < 0).length} 
                 badgeType="shortage"
               />
               <FilterPill 
                 active={filter === "SURPLUS"} 
                 onClick={() => setFilter("SURPLUS")} 
                 label="Sobrantes" 
                 count={countedItems.filter(i => (i.difference ?? 0) > 0).length} 
                 badgeType="surplus"
               />
               <FilterPill 
                 active={filter === "MATCH"} 
                 onClick={() => setFilter("MATCH")} 
                 label="Correctos" 
                 count={countedItems.filter(i => i.difference === 0).length} 
               />
            </div>

            {/* Acciones y Estados de Ajuste */}
            <div className="w-full md:w-auto shrink-0 flex items-center justify-end">
              {audit.status === "OPEN" && (
                  <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5">
                     <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                     <span>Auditoría en curso en POS. Ajustes bloqueados hasta finalizar.</span>
                  </div>
              )}

              {audit.status === "CLOSED" && !audit.isApplied && discrepancyItems.length === 0 && (
                  <div className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl text-xs border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                     <span>Inventario cuadrado. No se requieren ajustes.</span>
                  </div>
              )}

              {audit.status === "CLOSED" && !audit.isApplied && discrepancyItems.length > 0 && (
                  <button 
                      onClick={handleApply} 
                      disabled={isPending}
                      className="w-full md:w-auto h-10 px-5 bg-black dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                      {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isPending ? "Aplicando ajustes..." : `Aplicar Ajustes (${discrepancyItems.length} diferencias)`}</span>
                  </button>
              )}
              
              {audit.isApplied && (
                  <div className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl text-xs border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                     <span>Ajustes Aplicados</span>
                  </div>
              )}
            </div>
         </div>

         {/* Tabla de Productos Sobria y Aireada */}
         <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-zinc-50/75 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <tr>
                        <th className="px-5 sm:px-6 py-3.5">Producto</th>
                        <th className="px-5 sm:px-6 py-3.5 text-center font-mono">Stock Inicial</th>
                        <th className="px-5 sm:px-6 py-3.5 text-center font-mono">Ventas</th>
                        <th className="px-5 sm:px-6 py-3.5 text-center font-mono">Esperado</th>
                        <th className="px-5 sm:px-6 py-3.5 text-center font-mono">Conteo (POS)</th>
                        <th className="px-5 sm:px-6 py-3.5 text-right font-mono">Diferencia</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {filteredItems.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-16 text-center text-zinc-400 text-xs italic">
                              No hay productos que coincidan con el filtro seleccionado
                            </td>
                        </tr>
                    ) : (
                        filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                                <td className="px-5 sm:px-6 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">
                                  {item.productName}
                                </td>
                                <td className="px-5 sm:px-6 py-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400">
                                  {item.initialStock}
                                </td>
                                <td className="px-5 sm:px-6 py-3.5 text-center font-mono text-zinc-500 dark:text-zinc-400">
                                  {item.sales > 0 ? `-${item.sales}` : "0"}
                                </td>
                                <td className="px-5 sm:px-6 py-3.5 text-center font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                                  {item.expectedStock ?? "—"}
                                </td>
                                <td className="px-5 sm:px-6 py-3.5 text-center font-mono font-bold text-zinc-900 dark:text-white">
                                  {item.countedQuantity !== null ? item.countedQuantity : (
                                    <span className="text-[11px] font-normal text-zinc-400 italic">No contado</span>
                                  )}
                                </td>
                                <td className="px-5 sm:px-6 py-3.5 text-right font-mono">
                                    <Badge value={item.difference} isCounted={item.countedQuantity !== null} />
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

function KPIBox({ 
  title, 
  value, 
  subtitle, 
  icon, 
  isNegative,
  hasAlert
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: React.ReactNode; 
  isNegative?: boolean;
  hasAlert?: boolean;
}) {
    return (
        <div className="p-4 sm:p-5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs transition-all">
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{title}</span>
                <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">{icon}</div>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-mono font-black tracking-tight tabular-nums ${
              isNegative ? "text-rose-600 dark:text-rose-400" : hasAlert ? "text-zinc-900 dark:text-white" : "text-zinc-900 dark:text-white"
            }`}>
                {value}
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-medium">{subtitle}</p>
        </div>
    );
}

function FilterPill({ 
  active, 
  onClick, 
  label, 
  count,
  badgeType 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  count?: number;
  badgeType?: "shortage" | "surplus";
}) {
    return (
        <button 
            type="button"
            onClick={onClick}
            className={`
                inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0
                ${active 
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs" 
                    : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}
            `}
        >
            <span>{label}</span>
            {count !== undefined && count > 0 && (
              <span className={`
                font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded font-semibold
                ${active
                  ? "bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800"
                  : badgeType === "shortage" 
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}
              `}>
                {count}
              </span>
            )}
        </button>
    );
}

function Badge({ value, isCounted }: { value: number | null; isCounted?: boolean }) {
    if (value === null || !isCounted) {
      return <span className="text-zinc-300 dark:text-zinc-600">—</span>;
    }
    
    const isNegative = value < 0;
    const isPositive = value > 0;

    return (
        <span className={`
            inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold tabular-nums
            ${isNegative ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40" : 
              isPositive ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700" : 
              "text-zinc-500 dark:text-zinc-400"}
        `}>
            {isPositive ? `+${value}` : value}
        </span>
    );
}
