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
        <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
            {/* Header / Barra Superior */}
            <header className="h-14 sm:h-16 px-4 sm:px-6 bg-white flex items-center justify-between border-b border-zinc-200 shrink-0">
                <button 
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-2 text-zinc-500 hover:text-black transition-all group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-semibold text-xs sm:text-sm">Cerrar Sesión</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Terminal Lista</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-xl mx-auto w-full justify-center">
                <div className="bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200 shadow-xl">
                    <div className="mb-4">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
                            Apertura de Caja
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
                        {/* Tarjeta de Metadatos del Turno (Nombre y Fecha completos alineados a la izquierda) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-zinc-50 p-3 sm:p-3.5 rounded-2xl border border-zinc-200 text-left">
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-zinc-500 border border-zinc-200/60 shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">Cajero</p>
                                    <p className="font-bold text-xs sm:text-sm text-zinc-900 leading-snug text-left">{user.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-zinc-500 border border-zinc-200/60 shrink-0">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left">Fecha de Operación</p>
                                    <p className="font-bold text-xs sm:text-sm text-zinc-900 capitalize leading-snug text-left">
                                        {dateFormatter.format(now)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Selección de Sucursal con Dropdown Estilizado */}
                        <div>
                            <BranchSelect
                                branches={branches}
                                selectedBranchId={selectedBranchId}
                                onChange={setSelectedBranchId}
                                isLoading={isLoadingBranches}
                            />
                        </div>

                        {/* Monto Inicial - Con atajos rápidos centrados en dos renglones */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block" htmlFor="initialAmount">
                                Efectivo Inicial en Caja
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none">
                                    <span className="text-2xl sm:text-3xl font-black text-zinc-400">$</span>
                                </div>
                                <input
                                    id="initialAmount"
                                    type="text"
                                    required
                                    autoFocus
                                    inputMode="decimal"
                                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-3xl sm:text-4xl font-black text-zinc-900 bg-zinc-50 border-2 border-zinc-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all tracking-tight"
                                    placeholder="0.00"
                                    value={initialAmount}
                                    onChange={handleAmountChange}
                                    onBlur={handleBlur}
                                />
                            </div>

                            {/* Chips de atajo rápido centrados en dos renglones */}
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                {PRESET_AMOUNTS.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setInitialAmount(preset)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all text-center active:scale-95 shadow-xs ${
                                            initialAmount === preset
                                                ? 'bg-black text-white border-black shadow-sm'
                                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
                                        }`}
                                    >
                                        {preset === '0.00' ? 'Sin fondo ($0.00)' : `$${Number(preset).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full h-13 sm:h-14 bg-black text-white rounded-xl font-bold text-base shadow-sm hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <span>Iniciar Turno</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
