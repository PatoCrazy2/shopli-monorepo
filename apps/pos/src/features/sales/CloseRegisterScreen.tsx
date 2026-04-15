import { Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCloseRegister } from './hooks/useCloseRegister';

export default function CloseRegisterScreen() {
    const {
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

    if (!activeShift) return null;

    return (
        <div className="flex-1 w-full h-full bg-gray-50 flex items-center justify-center p-6 custom-scrollbar overflow-y-auto">
            <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl relative overflow-hidden">

                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-black to-gray-800" />

                <div className="text-center mb-10 mt-2">
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Cerrar Turno</h2>
                    <p className="text-gray-500 mt-2">Valide el efectivo físico antes de finalizar el turno activo.</p>
                </div>

                {/* Resumen del Turno */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 space-y-4">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-600 font-medium">Monto de Apertura</span>
                        <span className="font-semibold text-gray-900">${initialAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg relative before:absolute before:border-b-2 before:border-dotted before:border-gray-300 before:w-full before:-top-2">
                        <span className="text-gray-600 font-medium">Ventas en Efectivo</span>
                        <span className="font-semibold text-gray-900">+ ${totalSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-gray-600 font-medium">Gastos Caja Chica</span>
                        <span className="font-semibold text-red-600">- ${totalExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl bg-white p-3 rounded-lg border border-gray-200 mt-2">
                        <span className="text-gray-800 font-bold">Total Esperado</span>
                        <span className="font-black text-black">${expectedAmount.toFixed(2)}</span>
                    </div>
                </div>

                {/* Captura de Dinero Real */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-3" htmlFor="amount">
                        Efectivo Físico en Caja
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <span className="text-gray-400 font-bold text-2xl">$</span>
                        </div>
                        <input
                            id="amount"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="0.00"
                            value={physicalCount}
                            onChange={(e) => setPhysicalCount(e.target.value)}
                            className="block w-full pl-12 pr-4 py-5 font-black text-4xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <Calculator className="w-8 h-8 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Bloque de Diferencia Dinámico */}
                {physicalCount !== '' && (
                    <div className={`p-4 rounded-xl flex items-center justify-between mb-8 border transition-all ${difference === 0 ? 'bg-green-50 border-green-200 text-green-800' :
                        difference > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' :
                            'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        <div className="flex items-center gap-3">
                            {difference === 0 ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <AlertCircle className="w-6 h-6" />}
                            <span className="font-medium text-lg">
                                {difference === 0 ? 'Cuadre Perfecto' :
                                    difference > 0 ? 'Sobrante' : 'Faltante'}
                            </span>
                        </div>
                        <span className="font-bold text-2xl">
                            {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                        </span>
                    </div>
                )}

                {/* Mensaje de Error de Validación */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-r-lg">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-bold">{error}</span>
                    </div>
                )}

                {/* Acciones */}
                <div>
                    <button
                        onClick={handleCloseShift}
                        disabled={physicalCount === '' || isClosing}
                        className={`w-full py-5 rounded-xl font-bold text-xl text-white transition-all flex items-center justify-center gap-2 ${physicalCount === ''
                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                            : 'bg-black hover:bg-zinc-800 active:scale-[0.98] shadow-lg shadow-black/20'
                            }`}
                    >
                        {isClosing ? 'Cerrando Turno...' : 'Confirmar Cierre de Caja'}
                    </button>
                    {!physicalCount && (
                        <p className="text-center text-sm text-gray-500 mt-4">
                            Debe ingresar un monto para continuar.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
