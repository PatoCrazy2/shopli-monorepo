"use client";

import { Wallet, Calendar, Store, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteGasto } from "../actions";
import { useTransition } from "react";

type GastoWithRelations = {
    id: string;
    monto: any;
    descripcion: string;
    categoria: string;
    fecha: Date;
    sucursal: { nombre: string };
    proveedor?: { nombre: string } | null;
};

export function ExpenseList({ gastos }: { gastos: GastoWithRelations[] }) {
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

    const getCategoryStyles = (cat: string) => {
        switch (cat) {
            case "NOMINA": return "text-zinc-600 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800";
            case "RENTA": return "text-zinc-600 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800";
            case "MERCANCIA": return "text-zinc-600 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800";
            case "CAJA_CHICA": return "text-zinc-600 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800";
            default: return "text-zinc-600 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800";
        }
    };

    if (gastos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
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
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-900/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Historial de Egresos
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
                        {gastos.length}
                    </span>
                </div>
            </div>
            <div className="overflow-x-auto">
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
        </div>
    );
}
