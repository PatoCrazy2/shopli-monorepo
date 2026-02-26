import { PackageSearch, AlertTriangle } from "lucide-react";
import { useInventoryAuditWizard } from "./hooks/useInventoryAuditWizard";
import { useNavigate } from "react-router-dom";

export default function InventoryAuditWizard() {
    const navigate = useNavigate();
    const {
        auditProducts,
        currentIndex,
        currentProduct,
        isComplete,
        countedAmount,
        setCountedAmount,
        showWarning,
        requiresReason,
        selectedReason,
        setSelectedReason,
        comments,
        setComments,
        handleNext
    } = useInventoryAuditWizard();

    if (auditProducts.length === 0) return null; // Loading state

    if (isComplete) {
        return (
            <div className="flex w-full h-full bg-black text-white items-center justify-center p-6 text-center">
                <div className="max-w-md">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                        <PackageSearch className="w-12 h-12 text-black" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Auditoría Completada</h1>
                    <p className="text-gray-400 text-lg mb-8">El conteo ciego ha sido registrado. El turno se ha cerrado exitosamente.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-white text-black font-bold text-xl py-4 px-12 rounded-lg hover:bg-gray-200 h-16 min-w-[200px]"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    if (!currentProduct) return null;

    return (
        <div className="flex flex-col w-full h-full bg-gray-50 items-center justify-center p-6">
            <div className="w-full max-w-xl">
                {/* Indicador de Pasos */}
                <div className="flex justify-between items-center mb-8 px-4">
                    {auditProducts.map((_, idx) => (
                        <div key={idx} className="flex-1 flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                ${idx === currentIndex ? 'bg-black text-white' :
                                    idx < currentIndex ? 'bg-black/80 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {idx + 1}
                            </div>
                            {idx < auditProducts.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded-full ${idx < currentIndex ? 'bg-black/80' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-lg p-8 border border-gray-100 shadow-md relative overflow-hidden">
                    <div className="text-center mb-8 mt-4">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Conteo Ciego {currentIndex + 1} de {auditProducts.length}</span>
                        <h2 className="text-4xl font-black text-gray-900 leading-tight">{currentProduct.nombre}</h2>
                    </div>

                    {showWarning && !requiresReason && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
                            <p className="text-yellow-800 font-medium">La cantidad ingresada no coincide. Por favor, realiza un segundo conteo físico para verificar.</p>
                        </div>
                    )}

                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                            Cantidad Física Contada en Estante
                        </label>
                        <input
                            type="number"
                            inputMode="numeric"
                            autoFocus
                            value={countedAmount}
                            onChange={(e) => setCountedAmount(e.target.value)}
                            className="block w-full text-center h-20 font-black text-5xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black"
                            placeholder="0"
                        />
                    </div>

                    {requiresReason && (
                        <div className="space-y-4 mb-8 p-6 bg-red-50 rounded-lg border border-red-100">
                            <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                                <AlertTriangle className="w-5 h-5" />
                                <span>Discrepancia Confirmada</span>
                            </div>
                            <p className="text-sm text-red-600 mb-4">La disparidad persiste. Es obligatorio justificar el ajuste para auditoría.</p>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Motivo del Ajuste *</label>
                                <select
                                    value={selectedReason}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="w-full h-14 px-4 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none font-medium text-base text-gray-900"
                                >
                                    <option value="" disabled>Seleccione un motivo...</option>
                                    <option value="Error de registro">Error de registro previo</option>
                                    <option value="Daño">Mercancía dañada/caducada</option>
                                    <option value="Faltante/Robo">Extravío / Robo detectado</option>
                                    <option value="Otro">Otro (Especificar en comentarios)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Comentarios Adicionales *</label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    className="w-full p-4 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-none h-24 text-base text-gray-900"
                                    placeholder="Justifique la diferencia de inventario..."
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleNext}
                        disabled={!countedAmount}
                        className={`w-full h-16 rounded-lg font-bold text-xl text-white flex items-center justify-center gap-2 
                            ${!countedAmount
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                : 'bg-black hover:bg-zinc-800 shadow-md'}`}
                    >
                        {currentIndex < auditProducts.length - 1 ? 'Guardar y Continuar' : 'Finalizar Auditoría'}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4 font-medium uppercase tracking-wider">
                        Paso obligatorio para CIERRE DE TURNO
                    </p>
                </div>
            </div>
        </div>
    );
}
