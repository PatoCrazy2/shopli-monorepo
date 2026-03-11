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
    } = useOpenRegister();

    if (!user) return null; // Should be handled by route guard

    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Apertura de Caja</h1>
                    <p className="text-gray-500">Inicia tu turno para comenzar a cobrar.</p>
                </div>

                <div className="space-y-6 mb-8">
                    {/* Read-only Info Cards */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Cajero</span>
                            <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Fecha</span>
                            <span className="text-sm font-semibold text-gray-900 capitalize">{dateFormatter.format(now)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Hora</span>
                            <span className="text-sm font-semibold text-gray-900">{timeFormatter.format(now)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm font-medium text-gray-500">Estado</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                ABIERTO (Se creará)
                            </span>
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-2">
                                Sucursal *
                            </label>
                            <select
                                id="branchId"
                                value={selectedBranchId}
                                onChange={(e) => setSelectedBranchId(e.target.value)}
                                disabled={isLoadingBranches || branches.length === 0}
                                className="block w-full px-4 py-4 text-lg border-gray-300 rounded-xl focus:ring-black focus:border-black bg-gray-50 transition-colors"
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

                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                                Monto inicial en caja *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-lg">$</span>
                                </div>
                                <input
                                    type="text"
                                    id="amount"
                                    required
                                    autoFocus
                                    className="block w-full pl-8 pr-4 py-4 text-2xl border-gray-300 rounded-xl focus:ring-black focus:border-black bg-gray-50 transition-colors"
                                    placeholder="0.00"
                                    value={initialAmount}
                                    onChange={handleAmountChange}
                                    onBlur={handleBlur}
                                />
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full h-14 flex items-center justify-center px-4 py-2 border border-transparent text-lg font-semibold rounded-xl shadow-sm text-white bg-black hover:bg-zinc-800 active:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                        >
                            Abrir Caja
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
