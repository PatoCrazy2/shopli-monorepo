"use client";

import { Wallet, Calendar, Store, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteGasto } from "../actions";
import { useTransition } from "react";
import Link from "next/link";

type GastoWithRelations = {
    id: string;
    monto: any;
    descripcion: string;
    categoria: string;
    fecha: Date;
    sucursal: { nombre: string };
    proveedor?: { nombre: string } | null;
};

interface ExpenseListProps {
    gastos: GastoWithRelations[];
    total?: number;
    page?: number;
    pageSize?: number;
    searchParams?: {
        sucursalId?: string;
        startDate?: string;
        categoria?: string;
    };
}

export function ExpenseList({
    gastos,
    total = gastos.length,
    page = 1,
    pageSize = 25,
    searchParams = {}
}: ExpenseListProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string) => {
        if (!confirm("¿Está seguro de eliminar este registro? Esta acción es irreversible.")) return;
        
        startTransition(async () => {
            const res = await deleteGasto(id);
            if (res.error) {
                alert(res.error);
            } else {
                alert("El registro ha sido removido del sistema.");
            }
        });
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const buildPageUrl = (targetPage: number) => {
        const params = new URLSearchParams();
        if (searchParams.sucursalId) params.set("sucursalId", searchParams.sucursalId);
        if (searchParams.startDate) params.set("startDate", searchParams.startDate);
        if (searchParams.categoria) params.set("categoria", searchParams.categoria);
        if (targetPage > 1) params.set("page", String(targetPage));
        const qs = params.toString();
        return qs ? `?${qs}` : "";
    };

    if (gastos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-6 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
                    <Wallet className="h-5 w-5 text-zinc-900 dark:text-zinc-100" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Sin egresos registrados</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1">
                    No se encontraron gastos para los filtros seleccionados o registra un nuevo gasto para comenzar.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            {/* Header del Bloque */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-900/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Historial de Egresos
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
                        {total}
                    </span>
                </div>
                {total > pageSize && (
                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
                        Página {page} de {totalPages}
                    </span>
                )}
            </div>

            {/* 1. Vista Móvil (Card Feed): bloque vertical legible y táctil */}
            <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-900">
                {gastos.map((g) => (
                    <div key={g.id} className="p-4 space-y-2.5">
                        {/* Fila Superior: Categoría + Monto */}
                        <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700 font-mono uppercase tracking-wide">
                                {g.categoria.replace("_", " ")}
                            </span>
                            <span className="font-mono font-extrabold text-base text-zinc-950 dark:text-zinc-50 tabular-nums tracking-tight">
                                -${Number(g.monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Descripción y Proveedor */}
                        <div>
                            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                                {g.descripcion}
                            </p>
                            {g.proveedor?.nombre && (
                                <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                                    Proveedor: {g.proveedor.nombre}
                                </p>
                            )}
                        </div>

                        {/* Fila Inferior: Sucursal + Fecha + Botón Eliminar Táctil */}
                        <div className="flex items-center justify-between pt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                                    <Store size={12} className="text-zinc-400 shrink-0" />
                                    <span className="truncate max-w-[120px]">{g.sucursal.nombre}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                                    <Calendar size={12} className="text-zinc-400 shrink-0" />
                                    <span>{format(new Date(g.fecha), "dd MMM yyyy", { locale: es })}</span>
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleDelete(g.id)}
                                disabled={isPending}
                                aria-label="Eliminar gasto"
                                className="w-9 h-9 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-none cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Vista Desktop (Tabla Tradicional Aireada) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                        <tr>
                            <th className="px-5 py-3">Descripción</th>
                            <th className="px-5 py-3">Sucursal</th>
                            <th className="px-5 py-3 text-center">Categoría</th>
                            <th className="px-5 py-3">Fecha</th>
                            <th className="px-5 py-3 text-right">Monto</th>
                            <th className="px-4 py-3 w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs">
                        {gastos.map((g) => (
                            <tr key={g.id} className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                                <td className="px-5 py-3.5">
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{g.descripcion}</span>
                                        {g.proveedor?.nombre && (
                                            <span className="text-[10px] text-zinc-400 uppercase tracking-wide truncate">
                                                {g.proveedor.nombre}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                        <Store size={12} className="text-zinc-400 shrink-0" />
                                        <span className="truncate">{g.sucursal.nombre}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700 font-mono uppercase">
                                        {g.categoria.replace("_", " ")}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                                        <Calendar size={12} className="text-zinc-400 shrink-0" />
                                        <span>{format(new Date(g.fecha), "dd MMM yyyy", { locale: es })}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                    -${Number(g.monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                    <button 
                                        type="button"
                                        onClick={() => handleDelete(g.id)}
                                        disabled={isPending}
                                        title="Eliminar registro"
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 cursor-pointer"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 3. Barra de Paginación Apple Crisp */}
            {total > pageSize && (
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-zinc-50/60 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-800 gap-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        <span className="sm:hidden">Pág. {page}/{totalPages}</span>
                        <span className="hidden sm:inline">
                            Mostrando {gastos.length} de {total} registros · Página {page} de {totalPages}
                        </span>
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {page > 1 ? (
                            <Link
                                href={buildPageUrl(page - 1)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-colors flex items-center gap-1 shadow-2xs"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Ant.</span>
                            </Link>
                        ) : (
                            <span className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-300 dark:text-zinc-700 cursor-not-allowed select-none flex items-center gap-1">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Ant.</span>
                            </span>
                        )}

                        {page < totalPages ? (
                            <Link
                                href={buildPageUrl(page + 1)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1 shadow-2xs"
                            >
                                <span>Sig.</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <span className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-300 dark:text-zinc-700 cursor-not-allowed select-none flex items-center gap-1">
                                <span>Sig.</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
