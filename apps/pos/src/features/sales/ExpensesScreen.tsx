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

    return (
        <div className="flex-1 w-full h-full bg-zinc-50 overflow-y-auto custom-scrollbar font-sans select-none p-3 sm:p-6">
            <div className="max-w-lg mx-auto w-full flex flex-col gap-6 pb-10">
                {/* Formulario de Registro */}
                <form
                    onSubmit={handleSave}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs flex flex-col gap-5"
                >
                    <div className="text-center">
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-950">
                            Registrar Salida de Efectivo
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                            Se descontará del efectivo esperado en tu corte de caja.
                        </p>
                    </div>

                    {/* Input de Monto con $ Dinámico */}
                    <div className="space-y-2">
                        <label
                            htmlFor="expenseAmount"
                            className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block text-center"
                        >
                            Monto del Gasto
                        </label>
                        <div
                            className="w-full bg-zinc-50/70 border border-zinc-200 rounded-full py-3 px-6 shadow-2xs focus-within:bg-white focus-within:ring-2 focus-within:ring-black/10 focus-within:border-zinc-400 flex items-center justify-center transition-all cursor-text"
                            onClick={() => document.getElementById('expenseAmount')?.focus()}
                        >
                            <div className="inline-flex items-center justify-center">
                                <span
                                    className={`text-2xl sm:text-3xl font-extrabold select-none pb-0.5 transition-colors ${
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
                                    className="text-center text-3xl sm:text-4xl font-extrabold text-zinc-950 bg-transparent focus:outline-none tracking-tight placeholder:text-zinc-300 tabular-nums"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={handleAmountChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Input de Motivo / Descripción + Chips Rápidos */}
                    <div className="space-y-2.5">
                        <label
                            htmlFor="expenseDescription"
                            className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block px-1"
                        >
                            Motivo o Concepto
                        </label>
                        <input
                            id="expenseDescription"
                            type="text"
                            placeholder="Ej. Pago de garrafón de agua, limpieza..."
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                if (error) setError(null);
                            }}
                            className="w-full h-13 px-5 bg-zinc-50/70 border border-zinc-200 rounded-full text-sm sm:text-base font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 transition-all shadow-2xs"
                        />

                        {/* Atajos de Conceptos Frecuentes */}
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
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-none active:scale-95 cursor-pointer ${
                                            isSelected
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-zinc-600 border-zinc-200/80 hover:bg-zinc-100'
                                        }`}
                                    >
                                        {concept}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200/80 rounded-full text-red-600 text-xs font-semibold flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {justSaved && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2">
                            <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
                            <span>Gasto registrado correctamente</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving || !amount || !description.trim()}
                        className="w-full h-13 sm:h-14 bg-black text-white rounded-full font-bold text-base shadow-sm hover:bg-zinc-800 active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none transition-transform cursor-pointer disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Guardando...' : 'Registrar Gasto'}
                    </button>
                </form>

                {/* Historial de Gastos del Turno Actual */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
                                Gastos del Turno
                            </h2>
                            <span className="w-6 h-6 rounded-full bg-zinc-200/70 border border-zinc-300/60 text-zinc-800 text-xs font-extrabold flex items-center justify-center tabular-nums">
                                {sortedExpenses.length}
                            </span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200/80 rounded-full shadow-2xs">
                            <span className="text-[11px] font-semibold text-zinc-500 uppercase">Total:</span>
                            <span className="text-xs sm:text-sm font-extrabold text-red-600 tabular-nums">
                                -${Number(totalExpenses).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {sortedExpenses.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-zinc-200/70 p-8 text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
                            <div className="w-11 h-11 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center">
                                <Banknote className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-700">
                                Sin salidas de efectivo en este turno
                            </p>
                            <p className="text-xs text-zinc-400 max-w-xs">
                                Los gastos que registres arriba aparecerán enlistados aquí.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {sortedExpenses.map((gasto) => (
                                <div
                                    key={gasto.id}
                                    className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 sm:p-4 shadow-2xs flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200/60 text-zinc-600 flex items-center justify-center shrink-0">
                                            <Banknote className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm sm:text-base font-semibold text-zinc-900 truncate leading-snug">
                                                {gasto.descripcion}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium mt-0.5">
                                                <Clock className="w-3 h-3 shrink-0" />
                                                <span>
                                                    {gasto.fecha
                                                        ? format(new Date(gasto.fecha), 'hh:mm a', { locale: es })
                                                        : 'Hoy'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <span className="text-base sm:text-lg font-extrabold text-red-600 tabular-nums tracking-tight shrink-0">
                                        -${Number(gasto.monto).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
