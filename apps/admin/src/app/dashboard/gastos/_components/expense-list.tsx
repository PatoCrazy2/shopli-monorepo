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
            <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Wallet className="h-12 w-12 text-zinc-200 dark:text-zinc-800 mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Sin movimientos</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/10 dark:bg-zinc-900/10">
                <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Historial de Egresos
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-8 py-4">Descripción</th>
                            <th className="px-8 py-4">Ubicación</th>
                            <th className="px-8 py-4 text-center">Categoría</th>
                            <th className="px-8 py-4">Fecha</th>
                            <th className="px-8 py-4 text-right">Monto</th>
                            <th className="px-8 py-4 w-[80px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                        {gastos.map((g) => (
                            <tr key={g.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{g.descripcion}</span>
                                        <span className="text-[10px] font-medium text-zinc-400 uppercase mt-0.5 tracking-wide">{g.proveedor?.nombre || "Sin Proveedor"}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                        <Store size={14} className="text-zinc-300" />
                                        {g.sucursal.nombre}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className={`inline-block rounded-lg px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase border border-transparent ${getCategoryStyles(g.categoria)}`}>
                                        {g.categoria.replace("_", " ")}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                                        <Calendar size={14} className="text-zinc-300" />
                                        {format(new Date(g.fecha), "dd MMM yyyy", { locale: es })}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right font-bold text-lg text-zinc-900 dark:text-zinc-100">
                                    -${Number(g.monto).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button 
                                        onClick={() => handleDelete(g.id)}
                                        disabled={isPending}
                                        className="p-2 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
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
