import { useState } from 'react';
import { User, Clock, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCloseRegister } from './hooks/useCloseRegister';

export default function CloseRegisterScreen() {
    const {
        user,
        activeShift,
        physicalCount,
        setPhysicalCount,
        isClosing,
        initialAmount,
        totalSales,
        expectedAmount,
        totalExpenses,
        difference,
        error,
        handleCloseShift,
    } = useCloseRegister();

    const [showBreakdown, setShowBreakdown] = useState(false);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    if (!activeShift) {
        return (
            <div className="flex-1 w-full h-full bg-zinc-50 flex items-center justify-center p-4 sm:p-6 text-center font-sans select-none">
                <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500 border border-zinc-200/60">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">No hay turno activo</h2>
                    <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                        Esta terminal no cuenta con un turno abierto actualmente para realizar corte de caja.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center w-full h-12 sm:h-14 bg-black text-white rounded-full font-bold text-sm sm:text-base hover:bg-zinc-800 active:scale-[0.99] shadow-xs cursor-pointer"
                    >
                        Ir al Catálogo de Ventas
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full bg-zinc-50 p-3 sm:p-6 overflow-hidden select-none font-sans">
            {/* Header Area Compacto */}
            <div className="shrink-0 flex items-center justify-between gap-2 mb-3">
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight truncate">
                        Corte de Caja
                    </h1>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-zinc-200/80 rounded-full text-xs font-semibold text-zinc-700 shadow-2xs">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span className="truncate max-w-[120px]">{user?.name || 'Cajero activo'}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-zinc-200/80 rounded-full text-xs font-semibold text-zinc-700 shadow-2xs">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>
                            {activeShift.openedAt ? format(new Date(activeShift.openedAt), 'hh:mm a', { locale: es }) : 'Hoy'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Layout Principal: Unificado y Compacto */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6 overflow-y-auto md:overflow-hidden pb-3 custom-scrollbar">
                {/* Columna Izquierda: Tarjeta de Resumen + Desglose Unificado */}
                <div className="md:col-span-6 lg:col-span-6 flex flex-col shrink-0">
                    <div className="bg-black text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-zinc-900 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider block">
                                    Total Esperado en Caja
                                </span>
                                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight tabular-nums block mt-0.5">
                                    {formatMoney(expectedAmount)}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBreakdown((prev) => !prev)}
                                className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 flex items-center gap-1 cursor-pointer transition-none select-none"
                            >
                                <span>{showBreakdown ? 'Ocultar' : 'Ver desglose (3)'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 ${showBreakdown ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Desglose Integrado (Versión Compacta) */}
                        {showBreakdown && (
                            <div className="mt-3.5 pt-3 border-t border-zinc-800 space-y-1.5 text-xs">
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-zinc-400 font-medium">Fondo Inicial</span>
                                    <span className="font-bold text-zinc-200 tabular-nums">
                                        {formatMoney(initialAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-zinc-400 font-medium">Ventas en Efectivo</span>
                                    <span className="font-bold text-emerald-400 tabular-nums">
                                        +{formatMoney(totalSales)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-zinc-400 font-medium">Gastos Caja Chica</span>
                                    <span className="font-bold text-red-400 tabular-nums">
                                        {totalExpenses > 0 ? `-${formatMoney(totalExpenses)}` : formatMoney(0)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Conteo Físico en Zona Prioritaria (Siempre visible sin scroll excesivo) */}
                <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-between bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs gap-3.5">
                    <div className="space-y-3">
                        <div className="border-b border-zinc-100 pb-2">
                            <h2 className="text-sm sm:text-base font-black tracking-tight text-zinc-900">
                                Conteo Físico
                            </h2>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                                Ingresa el efectivo total en gaveta
                            </p>
                        </div>

                        {/* Campo de Captura estilo Píldora Compacto */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider" htmlFor="amount">
                                Efectivo en Gaveta
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-zinc-400 font-extrabold text-xl sm:text-2xl">$</span>
                                </div>
                                <input
                                    id="amount"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={physicalCount}
                                    onChange={(e) => setPhysicalCount(e.target.value)}
                                    className="block w-full pl-9 sm:pl-11 pr-4 h-13 sm:h-14 font-black text-2xl sm:text-3xl text-zinc-950 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 tracking-tight tabular-nums"
                                />
                            </div>
                        </div>

                        {/* Indicador de Diferencia Compacto */}
                        {physicalCount !== '' && (
                            <div className={`p-3 rounded-2xl flex items-center justify-between border ${
                                Math.abs(difference) < 0.01
                                    ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                                    : difference > 0
                                    ? 'bg-blue-50/70 border-blue-200/80 text-blue-950'
                                    : 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                            }`}>
                                <div className="flex items-center gap-2.5">
                                    {Math.abs(difference) < 0.01 ? (
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                        </div>
                                    ) : difference > 0 ? (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-4 h-4 text-blue-700" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                            <AlertCircle className="w-4 h-4 text-amber-700" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-extrabold text-xs sm:text-sm">
                                            {Math.abs(difference) < 0.01
                                                ? 'Cuadre Exacto'
                                                : difference > 0
                                                ? 'Sobrante en Caja'
                                                : 'Faltante en Caja'}
                                        </p>
                                        <p className="text-[11px] text-zinc-500">
                                            {Math.abs(difference) < 0.01
                                                ? 'Coincide con balance'
                                                : difference > 0
                                                ? 'Mayor al esperado'
                                                : 'Menor al esperado'}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-black text-base sm:text-lg tabular-nums tracking-tight pl-2">
                                    {difference > 0 ? `+${formatMoney(difference)}` : formatMoney(difference)}
                                </span>
                            </div>
                        )}

                        {/* Mensaje de Error */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 rounded-2xl text-xs font-semibold">
                                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Botón de Cierre */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={handleCloseShift}
                            disabled={physicalCount === '' || isClosing}
                            className={`w-full h-12 sm:h-14 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none ${
                                physicalCount === ''
                                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                                    : 'bg-black text-white hover:bg-zinc-800 active:scale-[0.99]'
                            }`}
                        >
                            {isClosing ? (
                                'Procesando...'
                            ) : (
                                <>
                                    <span>Continuar</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        <p className="text-center text-[10px] text-zinc-400 mt-2 font-medium">
                            {physicalCount === ''
                                ? 'Ingresa el monto para continuar'
                                : 'Paso 1 de 2: Validación de efectivo'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
