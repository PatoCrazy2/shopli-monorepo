import { useState } from 'react';
import { Banknote, Clock, AlertCircle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useExpenses } from './hooks/useExpenses';

const QUICK_CONCEPTS = [
    'Garrafón de agua',
    'Artículos de limpieza',
    'Bolsas / Empaque',
    'Papelería',
    'Comida / Bebida',
];

export default function ExpensesScreen() {
    const { expensesInShift = [], totalExpenses, addCajaChicaGasto } = useExpenses();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [justSaved, setJustSaved] = useState(false);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
            setAmount(val);
            if (error) setError(null);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Ingresa un monto mayor a $0.00');
            return;
        }

        if (description.trim().length < 3) {
            setError('Escribe un motivo o descripción breve (mín. 3 letras).');
            return;
        }

        setIsSaving(true);
        try {
            await addCajaChicaGasto(parsedAmount, description.trim());
            setAmount('');
            setDescription('');
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
        } catch (err: any) {
            setError(err.message || 'Error al registrar el gasto.');
        } finally {
            setIsSaving(false);
        }
    };

    const sortedExpenses = [...expensesInShift].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(val);
    };

    return (
        <div className="flex flex-col w-full h-full bg-zinc-50 p-4 sm:p-6 overflow-hidden select-none font-sans">
            {/* Header Area Compacto (Idéntico a Historial de Ventas) */}
            <div className="shrink-0 flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-2xl font-black text-zinc-900 tracking-tight truncate">
                        Caja Chica & Gastos
                    </h1>
                    <p className="text-xs text-zinc-500 font-medium hidden sm:block truncate">
                        Registra salidas menores de efectivo y consulta los movimientos del turno
                    </p>
                </div>
            </div>

            {/* Summary Banner de 2 Columnas Balanceadas */}
            <div className="shrink-0 bg-black text-white p-4 sm:p-5 rounded-3xl mb-4 shadow-sm border border-zinc-900 grid grid-cols-2 divide-x divide-zinc-800">
                <div className="pr-3 sm:pr-5 flex flex-col justify-center">
                    <span className="text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1">
                        Total Retirado (Turno)
                    </span>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight tabular-nums truncate">
                        -{formatMoney(Number(totalExpenses))}
                    </span>
                </div>
                <div className="pl-3 sm:pr-5 flex flex-col justify-center">
                    <span className="text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1">
                        Salidas Registradas
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight tabular-nums">
                            {sortedExpenses.length}
                        </span>
                        <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                            {sortedExpenses.length === 1 ? 'salida' : 'salidas'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Cuerpo Principal Adaptativo: Split View en Pantallas Medianas/Grandes */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 overflow-y-auto md:overflow-hidden pb-4">
                {/* Lado Izquierdo: Formulario de Salida de Efectivo */}
                <div className="md:col-span-5 lg:col-span-4 flex flex-col shrink-0">
                    <form
                        onSubmit={handleSave}
                        className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs flex flex-col gap-4"
                    >
                        <div className="border-b border-zinc-100 pb-3">
                            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-900">
                                Registrar Salida
                            </h2>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                                Se descontará del efectivo esperado en caja.
                            </p>
                        </div>

                        {/* Input de Monto estilo Píldora */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="expenseAmount"
                                className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block text-center"
                            >
                                Monto del Gasto
                            </label>
                            <div
                                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-full py-2.5 px-5 shadow-2xs focus-within:bg-white focus-within:ring-2 focus-within:ring-black/10 focus-within:border-zinc-400 flex items-center justify-center transition-all cursor-text"
                                onClick={() => document.getElementById('expenseAmount')?.focus()}
                            >
                                <div className="inline-flex items-center justify-center">
                                    <span
                                        className={`text-2xl sm:text-3xl font-black select-none pb-0.5 transition-colors ${
                                            amount.trim().length > 0 ? 'text-zinc-950' : 'text-zinc-300'
                                        }`}
                                    >
                                        $
                                    </span>
                                    <input
                                        id="expenseAmount"
                                        type="text"
                                        inputMode="decimal"
                                        autoFocus
                                        style={{ width: `${Math.max(amount.length || 4, 4)}ch` }}
                                        className="text-center text-2xl sm:text-3xl font-black text-zinc-950 bg-transparent focus:outline-none tracking-tight placeholder:text-zinc-300 tabular-nums"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Input de Motivo / Descripción estilo Píldora */}
                        <div className="space-y-2">
                            <label
                                htmlFor="expenseDescription"
                                className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block px-1"
                            >
                                Motivo o Concepto
                            </label>
                            <input
                                id="expenseDescription"
                                type="text"
                                placeholder="Ej. Garrafón de agua, insumos..."
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    if (error) setError(null);
                                }}
                                className="w-full h-11 sm:h-12 px-4 bg-zinc-50/70 border border-zinc-200 rounded-full text-xs sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 transition-all shadow-2xs"
                            />

                            {/* Chips Rápidos de Conceptos Frecuentes */}
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {QUICK_CONCEPTS.map((concept) => {
                                    const isSelected = description === concept;
                                    return (
                                        <button
                                            key={concept}
                                            type="button"
                                            onClick={() => {
                                                setDescription(concept);
                                                if (error) setError(null);
                                            }}
                                            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-none active:scale-95 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100'
                                            }`}
                                        >
                                            {concept}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {error && (
                            <div className="px-4 py-2.5 bg-red-50 border border-red-200/80 rounded-full text-red-600 text-xs font-semibold flex items-center justify-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {justSaved && (
                            <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2">
                                <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
                                <span>Gasto registrado correctamente</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSaving || !amount || !description.trim()}
                            className="w-full h-12 bg-black text-white rounded-full font-bold text-sm shadow-sm hover:bg-zinc-800 active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none transition-transform cursor-pointer disabled:cursor-not-allowed mt-1"
                        >
                            {isSaving ? 'Guardando...' : 'Registrar Salida'}
                        </button>
                    </form>
                </div>

                {/* Lado Derecho: Lista de Salidas del Turno (Full Canvas Scroll) */}
                <div className="md:col-span-7 lg:col-span-8 flex flex-col min-h-0">
                    <div className="flex items-center justify-between pb-3 px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                Movimientos del Turno Actual
                            </span>
                            <span className="w-5 h-5 rounded-full bg-zinc-200/80 text-zinc-700 text-[11px] font-extrabold flex items-center justify-center tabular-nums">
                                {sortedExpenses.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-0.5">
                        {sortedExpenses.length === 0 ? (
                            <div className="h-full min-h-[220px] bg-white rounded-3xl border border-zinc-200/70 p-8 text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
                                <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center">
                                    <Banknote className="w-6 h-6 stroke-[1.5]" />
                                </div>
                                <p className="text-sm sm:text-base font-bold text-zinc-800">
                                    Sin salidas de efectivo en este turno
                                </p>
                                <p className="text-xs text-zinc-500 max-w-xs">
                                    Cualquier egreso o gasto registrado desde el formulario aparecerá aquí al instante.
                                </p>
                            </div>
                        ) : (
                            sortedExpenses.map((gasto) => (
                                <div
                                    key={gasto.id}
                                    className="bg-white p-4 rounded-2xl shadow-xs border border-zinc-200/80 flex items-center justify-between hover:bg-zinc-50/80 transition-colors"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
                                            <Banknote className="w-5 h-5 stroke-[2]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                                                {gasto.descripcion}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mt-0.5">
                                                <Clock className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                                                <span>
                                                    {gasto.fecha
                                                        ? format(new Date(gasto.fecha), 'hh:mm a', { locale: es })
                                                        : 'Hoy'}
                                                </span>
                                                <span className="text-zinc-300">•</span>
                                                <span className="text-zinc-400">Salida de efectivo</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end shrink-0 pl-3">
                                        <span className="text-base sm:text-lg font-black text-red-600 tabular-nums tracking-tight">
                                            -{formatMoney(Number(gasto.monto))}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-100 border border-zinc-200/60 px-2.5 py-0.5 rounded-full mt-0.5">
                                            Turno Activo
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
