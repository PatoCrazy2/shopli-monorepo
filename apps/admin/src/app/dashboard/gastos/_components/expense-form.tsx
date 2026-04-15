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
                className="bg-black text-white hover:bg-zinc-800 font-bold uppercase text-[10px] tracking-widest px-6 h-11 rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center border border-transparent"
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Gasto
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 text-zinc-900 dark:text-zinc-100">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Fecha</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <input 
                                                type="date" 
                                                {...register("fecha", { required: true })}
                                                className="w-full pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-medium focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-zinc-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-zinc-900 dark:text-zinc-100">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Monto (MXN)</label>
                                        <div className="relative">
                                            <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                placeholder="0.00"
                                                {...register("monto", { required: true })}
                                                className="w-full pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-lg focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-zinc-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-zinc-900 dark:text-zinc-100">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Sucursal de Origen</label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
                                        <select 
                                            {...register("sucursal_id", { required: true })}
                                            className="w-full pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-medium focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                        >
                                            <option value="" disabled>Seleccionar Sucursal...</option>
                                            {sucursales.map(s => (
                                                <option key={s.id} value={s.id}>{s.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 text-zinc-900 dark:text-zinc-100">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Categoría</label>
                                    <select 
                                        {...register("categoria", { required: true })}
                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-xs uppercase tracking-tight focus:ring-1 focus:ring-black outline-none transition-all appearance-none"
                                    >
                                        <option value="NOMINA">NÓMINA & STAFF</option>
                                        <option value="RENTA">RENTA & LOCAL</option>
                                        <option value="MERCANCIA">COMPRA MERCANCÍA</option>
                                        <option value="CAJA_CHICA">GASTOS MENORES / CAJA CHICA</option>
                                        <option value="VARIABLE">OTROS VARIABLES</option>
                                    </select>
                                </div>

                                <div className="space-y-2 text-zinc-900 dark:text-zinc-100">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Motivo detallado</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <textarea 
                                            {...register("descripcion", { required: true })}
                                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-medium text-sm focus:ring-1 focus:ring-black outline-none transition-all min-h-[100px] placeholder:text-zinc-400"
                                            placeholder="Describa el motivo del egreso..."
                                        />
                                    </div>
                                </div>

                                <div className="p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10 flex items-center justify-center gap-4 group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900/30 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center shadow-sm text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                        <ImageIcon size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold uppercase tracking-tight text-zinc-500">Adjuntar Comprobante</span>
                                        <span className="text-[9px] font-medium text-zinc-400 mt-1">Próximamente disponible</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 mt-auto shrink-0 flex gap-4">
                                <button 
                                    type="button" 
                                    onClick={() => setOpen(false)}
                                    className="flex-1 py-3 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:text-black dark:hover:text-white transition-all shadow-sm rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isPending}
                                    className="flex-[2] h-12 bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
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
