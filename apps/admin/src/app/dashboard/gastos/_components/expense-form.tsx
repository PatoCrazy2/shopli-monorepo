"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { GastoCategoria } from "@shopli/db";
import { createGasto } from "../actions";
import { 
    PlusCircle, Wallet, Receipt, Calendar, Store, 
    FileText, ArrowRight, Image as ImageIcon
} from "lucide-react";

type FormValues = {
    sucursal_id: string;
    categoria: GastoCategoria;
    monto: string;
    descripcion: string;
    fecha: string;
    proveedor_id?: string;
};

export function ExpenseForm({ sucursales }: { sucursales: { id: string, nombre: string }[] }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { register, handleSubmit, reset, setValue } = useForm<FormValues>({
        defaultValues: {
            fecha: new Date().toISOString().split('T')[0],
            sucursal_id: "",
            categoria: GastoCategoria.CAJA_CHICA,
        }
    });

    const onSubmit = (data: FormValues) => {
        if (!data.sucursal_id) {
            alert("Por favor seleccione una sucursal.");
            return;
        }

        startTransition(async () => {
            const res = await createGasto({
                ...data,
                monto: parseFloat(data.monto),
                proveedor_id: data.proveedor_id || null,
            });

            if (res.error) {
                alert(res.error);
            } else {
                alert("Gasto registrado exitosamente.");
                reset();
                setOpen(false);
            }
        });
    };

    return (
        <>
            <button 
                onClick={() => setOpen(true)}
                className="h-10 px-4 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Registrar Gasto</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative border border-zinc-100 dark:border-zinc-900">
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[90vh]">
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-900 shrink-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                            Registro de Gasto
                                        </h2>
                                        <p className="text-sm font-medium text-zinc-400 mt-1">
                                            Indica los detalles del egreso.
                                        </p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setOpen(false)}
                                        className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors p-2"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>

                            {/* Body (scrollable) */}
                            <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-zinc-950">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5 text-zinc-900 dark:text-zinc-100">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Fecha</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                            <input 
                                                type="date" 
                                                {...register("fecha", { required: true })}
                                                className="w-full pl-9 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-mono outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-zinc-900 dark:text-zinc-100">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Monto (MXN)</label>
                                        <div className="relative">
                                            <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                placeholder="0.00"
                                                {...register("monto", { required: true })}
                                                className="w-full pl-9 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-mono text-sm font-semibold outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-zinc-900 dark:text-zinc-100">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Sucursal de Origen</label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 z-10 pointer-events-none" />
                                        <select 
                                            {...register("sucursal_id", { required: true })}
                                            className="w-full pl-9 pr-8 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-medium outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Seleccionar Sucursal...</option>
                                            {sucursales.map(s => (
                                                <option key={s.id} value={s.id}>{s.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-zinc-900 dark:text-zinc-100">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Categoría</label>
                                    <select 
                                        {...register("categoria", { required: true })}
                                        className="w-full px-3 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-semibold outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="NOMINA">Nómina & Staff</option>
                                        <option value="RENTA">Renta & Local</option>
                                        <option value="MERCANCIA">Compra Mercancía</option>
                                        <option value="CAJA_CHICA">Gastos Menores / Caja Chica</option>
                                        <option value="VARIABLE">Otros Variables</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5 text-zinc-900 dark:text-zinc-100">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Motivo detallado</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                                        <textarea 
                                            {...register("descripcion", { required: true })}
                                            className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-medium outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all min-h-[80px] placeholder:text-zinc-400"
                                            placeholder="Describa el motivo del egreso..."
                                        />
                                    </div>
                                </div>

                                <div className="p-3.5 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 flex items-center justify-center gap-3 group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900/30 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                        <ImageIcon size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Adjuntar Comprobante</span>
                                        <span className="text-[9px] font-mono text-zinc-400">Próximamente disponible</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-850 mt-auto shrink-0 flex items-center justify-end gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setOpen(false)}
                                    className="px-4 h-10 text-zinc-600 dark:text-zinc-400 font-semibold text-xs rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isPending}
                                    className="px-5 h-10 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl font-semibold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                                >
                                    {isPending ? "Procesando..." : "Confirmar Egreso"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
