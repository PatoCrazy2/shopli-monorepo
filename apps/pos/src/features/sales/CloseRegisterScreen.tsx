import { User, Clock, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';
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

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    if (!activeShift) {
        return (
            <div className="flex-1 w-full h-full bg-zinc-50 flex items-center justify-center p-6 text-center font-sans">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl">
                    <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-500">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">No hay turno activo</h2>
                    <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                        Esta terminal no cuenta con un turno abierto actualmente para realizar corte de caja.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center w-full h-12 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 active:scale-95 transition-all shadow-sm"
                    >
                        Ir al Panel Principal
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full h-full bg-zinc-50 flex items-center justify-center p-4 sm:p-6 custom-scrollbar overflow-y-auto font-sans">
            <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xl relative overflow-hidden">
                {/* Encabezado y Contexto del Turno */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mb-2">
                        Corte de Caja
                    </h2>
                    <p className="text-zinc-500 text-xs sm:text-sm mb-4">
                        Valida el efectivo físico antes de proceder con el cierre del turno.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-full text-xs font-semibold text-zinc-700">
                            <User className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{user?.name || 'Cajero activo'}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-full text-xs font-semibold text-zinc-700">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>
                                Inicio: {activeShift.openedAt ? format(new Date(activeShift.openedAt), 'hh:mm a', { locale: es }) : 'Hoy'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Resumen del Balance Contable */}
                <div className="bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-200 mb-6 space-y-3">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-zinc-600 font-medium">Fondo Inicial de Caja</span>
                        <span className="font-bold text-zinc-900">{formatMoney(initialAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-zinc-600 font-medium">Ventas en Efectivo</span>
                        <span className="font-bold text-emerald-700">+{formatMoney(totalSales)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-zinc-600 font-medium">Gastos de Caja Chica</span>
                        <span className="font-bold text-red-600">
                            {totalExpenses > 0 ? `-${formatMoney(totalExpenses)}` : formatMoney(0)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center bg-black text-white p-3.5 rounded-xl mt-3 shadow-sm">
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400">
                            Total Esperado
                        </span>
                        <span className="text-lg sm:text-xl font-black tracking-tight">
                            {formatMoney(expectedAmount)}
                        </span>
                    </div>
                </div>

                {/* Captura de Efectivo Físico */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2" htmlFor="amount">
                        Efectivo Físico en Caja
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-zinc-400 font-black text-2xl sm:text-3xl">$</span>
                        </div>
                        <input
                            id="amount"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="0.00"
                            value={physicalCount}
                            onChange={(e) => setPhysicalCount(e.target.value)}
                            className="block w-full pl-10 sm:pl-12 pr-4 py-3.5 sm:py-4 font-black text-3xl sm:text-4xl text-zinc-900 bg-zinc-50 border-2 border-zinc-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all tracking-tight"
                        />
                    </div>
                </div>

                {/* Bloque de Diferencia Dinámico */}
                {physicalCount !== '' && (
                    <div className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between mb-6 border transition-all animate-in fade-in duration-150 ${
                        Math.abs(difference) < 0.01
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : difference > 0
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            {Math.abs(difference) < 0.01 ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            ) : difference > 0 ? (
                                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            )}
                            <div>
                                <p className="font-bold text-xs sm:text-sm">
                                    {Math.abs(difference) < 0.01
                                        ? 'Cuadre Exacto'
                                        : difference > 0
                                        ? 'Sobrante en Caja'
                                        : 'Faltante en Caja'}
                                </p>
                                <p className="text-[11px] opacity-80">
                                    {Math.abs(difference) < 0.01
                                        ? 'El efectivo físico coincide con el sistema'
                                        : difference > 0
                                        ? 'Hay más efectivo del registrado'
                                        : 'Hay menos efectivo del esperado'}
                                </p>
                            </div>
                        </div>
                        <span className="font-black text-lg sm:text-xl font-mono tracking-tight shrink-0 pl-2">
                            {difference > 0 ? `+${formatMoney(difference)}` : formatMoney(difference)}
                        </span>
                    </div>
                )}

                {/* Mensaje de Error de Validación */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 rounded-2xl text-xs font-bold">
                        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Acciones */}
                <div>
                    <button
                        onClick={handleCloseShift}
                        disabled={physicalCount === '' || isClosing}
                        className={`w-full py-4 rounded-xl font-bold text-base text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
                            physicalCount === ''
                                ? 'bg-zinc-300 cursor-not-allowed text-zinc-500'
                                : 'bg-black hover:bg-zinc-800 active:scale-[0.98]'
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
                    <p className="text-center text-xs text-zinc-400 mt-3 font-medium">
                        {physicalCount === ''
                            ? 'Ingresa el monto de efectivo para continuar con el cierre'
                            : 'Paso 1 de 2: Validación de efectivo antes de auditoría de inventario'}
                    </p>
                </div>
            </div>
        </div>
    );
}
