import { ArrowLeft, ArrowRight, User, Calendar } from 'lucide-react';
import { useOpenRegister } from './hooks/useOpenRegister';
import { BranchSelect } from './components/BranchSelect';

export default function OpenRegisterScreen() {
    const {
        user,
        initialAmount,
        setInitialAmount,
        error,
        branches,
        selectedBranchId,
        setSelectedBranchId,
        isLoadingBranches,
        handleAmountChange,
        handleBlur,
        handleSubmit,
        logout,
    } = useOpenRegister();

    if (!user) return null;

    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const PRESET_AMOUNTS = ['0.00', '200.00', '300.00', '500.00', '1000.00'];

    return (
        <div className="h-dvh bg-zinc-50 flex flex-col font-sans text-zinc-900 overflow-y-auto select-none">
            <main className="flex-1 flex flex-col px-4 py-8 sm:py-12 max-w-md mx-auto w-full justify-center">
                {/* Título */}
                <div className="mb-6 text-center">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
                        Apertura de Caja
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Tarjeta de Metadatos del Turno con profundidad visual */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs text-left">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-9 h-9 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-200/60 shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cajero</p>
                                <p className="font-bold text-xs sm:text-sm text-zinc-900 leading-snug truncate">{user.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-9 h-9 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-200/60 shrink-0">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Fecha</p>
                                <p className="font-bold text-xs sm:text-sm text-zinc-900 capitalize leading-snug truncate">
                                    {dateFormatter.format(now)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Selección de Sucursal con Dropdown */}
                    <div>
                        <BranchSelect
                            branches={branches}
                            selectedBranchId={selectedBranchId}
                            onChange={setSelectedBranchId}
                            isLoading={isLoadingBranches}
                        />
                    </div>

                    {/* Monto Inicial - Input redondeado con $ integrado armónicamente */}
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block text-center" htmlFor="initialAmount">
                            Efectivo Inicial en Caja
                        </label>
                        <div 
                            className="w-full bg-white border border-zinc-200 rounded-full py-3 px-6 shadow-xs focus-within:ring-2 focus-within:ring-black/10 focus-within:border-zinc-400 flex items-center justify-center transition-all cursor-text"
                            onClick={() => document.getElementById('initialAmount')?.focus()}
                        >
                            <div className="inline-flex items-center justify-center">
                                <span className={`text-2xl sm:text-3xl font-extrabold select-none pb-0.5 transition-colors ${
                                    initialAmount.trim().length > 0 ? 'text-zinc-900' : 'text-zinc-300'
                                }`}>
                                    $
                                </span>
                                <input
                                    id="initialAmount"
                                    type="text"
                                    required
                                    autoFocus
                                    inputMode="decimal"
                                    style={{ width: `${Math.max(initialAmount.length || 4, 4)}ch` }}
                                    className="text-center text-3xl sm:text-4xl font-extrabold text-zinc-900 bg-transparent focus:outline-none tracking-tight placeholder:text-zinc-300"
                                    placeholder="0.00"
                                    value={initialAmount}
                                    onChange={handleAmountChange}
                                    onBlur={handleBlur}
                                />
                            </div>
                        </div>

                        {/* Chips de atajo rápido estilo píldora (rounded-full) */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            {PRESET_AMOUNTS.map((preset) => {
                                const isSelected = initialAmount === preset;
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setInitialAmount(preset)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border text-center active:scale-95 shadow-2xs ${
                                            isSelected
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                                        }`}
                                    >
                                        {preset === '0.00' ? 'Sin fondo ($0.00)' : `$${Number(preset).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-full text-red-700 text-xs font-semibold flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-2 space-y-3">
                        <button
                            type="submit"
                            className="w-full h-13 sm:h-14 bg-black text-white rounded-full font-bold text-base shadow-sm hover:bg-zinc-800 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Iniciar Turno</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        {/* Opción B: Botón Cerrar Sesión reubicado como acción secundaria */}
                        <button
                            type="button"
                            onClick={logout}
                            className="w-full py-2.5 flex items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-900 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Cerrar sesión / Cambiar de cajero</span>
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
