import { ArrowLeft, RefreshCw, Landmark, User, Calendar } from 'lucide-react';
import { useOpenRegister } from './hooks/useOpenRegister';

export default function OpenRegisterScreen() {
    const {
        user,
        initialAmount,
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
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-black">
            {/* Header / Top Bar */}
            <header className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
                <button 
                    onClick={logout}
                    className="flex items-center gap-2 text-gray-500 hover:text-black transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-semibold text-sm">Cerrar Sesión</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Terminal Lista</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full">
                <div className="mb-10">
                    <h1 className="text-4xl font-black tracking-tight mb-2">Apertura de Caja</h1>
                    <p className="text-gray-500 font-medium">Prepara tu terminal para la jornada de hoy.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8">
                    {/* Sección de Info Personal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cajero</p>
                                <p className="font-bold text-gray-900">{user.name}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Calendar className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha de Operación</p>
                                <p className="font-bold text-gray-900 capitalize">{dateFormatter.format(now)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Selección de Sucursal */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            <Landmark className="w-3 h-3" />
                            Punto de Venta / Sucursal
                        </label>
                        <select
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            disabled={isLoadingBranches || branches.length === 0}
                            className="w-full h-16 px-5 text-lg font-bold bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl transition-all appearance-none cursor-pointer"
                            required
                        >
                            <option value="" disabled>Selecciona una sucursal</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Monto Inicial - El Protagonista */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
                            Efectivo Inicial en Caja
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <span className="text-3xl font-black text-gray-300 group-focus-within:text-black transition-colors">$</span>
                            </div>
                            <input
                                type="text"
                                required
                                autoFocus
                                inputMode="decimal"
                                className="w-full pl-14 pr-6 py-8 text-5xl font-black bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl transition-all outline-none"
                                placeholder="0.00"
                                value={initialAmount}
                                onChange={handleAmountChange}
                                onBlur={handleBlur}
                            />
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium ml-1">Ingresa el fondo fijo asignado para este turno.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                            {error}
                        </div>
                    )}

                    <div className="mt-auto pt-6 space-y-4">
                        <button
                            type="submit"
                            className="w-full h-18 bg-black text-white rounded-2xl font-black text-xl shadow-xl shadow-black/10 hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            Iniciar Turno
                        </button>
                        
                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Sincronizando catálogo...
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
