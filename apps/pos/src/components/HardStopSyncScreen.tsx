import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2, AlertTriangle, WifiOff, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/db';
import { pushToCloud } from '../lib/sync';
import { useAuth } from '../contexts/AuthContext';

export function HardStopSyncScreen() {
    const { hasActiveShift } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Watch all pending items across the relevant tables
    const pendingSalesCount = useLiveQuery(() => db.sales.where('sync_status').equals('PENDING').count(), []) ?? 0;
    const pendingTurnosCount = useLiveQuery(() => db.turnos.where('sync_status').equals('PENDING').count(), []) ?? 0;
    const pendingAuditsCount = useLiveQuery(() => db.audits.where('sync_status').equals('PENDING').count(), []) ?? 0;

    const totalPending = pendingSalesCount + pendingTurnosCount + pendingAuditsCount;

    // Condición estricta: Mostrar SOLO cuando no hay un turno activo, pero aún hay datos pendientes locales.
    // Esto previene que se abra un turno nuevo o se cierre la app perdiendo datos.
    const shouldBlock = !hasActiveShift && totalPending > 0;

    const handleManualSync = async () => {
        setIsSyncing(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await pushToCloud();
            if (result.success) {
                // Como Dexie actualiza en bulkPut, los useLiveQuery bajarán a 0
                // Y este componente se desmontará solíto.
                setSuccessMessage("Datos sincronizados correctamente");
                
                // Limpiar la alerta de toast improvisado usando un timeout de UI de cortesía
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 3000);
            } else {
                setError("Revisa tu conexión a internet.");
            }
        } catch (err) {
            setError("Fallo de conexión crítico. Asegúrese de estar conectado.");
        } finally {
            setIsSyncing(false);
        }
    };

    if (!shouldBlock) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center font-sans">
            
            {/* Custom Shadcn-like Toasts overlay */}
            {(error || successMessage) && (
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100000] flex flex-col gap-2">
                    {error && (
                        <div className="bg-red-50 text-red-800 border-2 border-red-200 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <WifiOff className="w-6 h-6 shrink-0" />
                            <span className="font-bold text-lg">{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-green-50 text-green-800 border-2 border-green-200 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <CheckCircle2 className="w-6 h-6 shrink-0" />
                            <span className="font-bold text-lg">{successMessage}</span>
                        </div>
                    )}
                 </div>
            )}

            <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-10 shadow-3xl">
                <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-yellow-500/20">
                    <AlertTriangle className="w-12 h-12 text-yellow-500" />
                </div>
                
                <h1 className="text-3xl font-black mb-4 tracking-tight">Cierre de Turno Incompleto</h1>
                
                <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                    El turno cerró localmente, pero hay <strong className="text-white">{totalPending} registro(s)</strong> pendientes de enviar al administrador central por falta de internet.
                </p>

                <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-800 mb-8 flex flex-col gap-2 text-sm text-left font-medium text-zinc-300">
                    <div className="flex justify-between"><span>Ventas pendientes:</span> <span className="text-white">{pendingSalesCount}</span></div>
                    <div className="flex justify-between"><span>Auditorías pendientes:</span> <span className="text-white">{pendingAuditsCount}</span></div>
                    <div className="flex justify-between"><span>Turno pendiente:</span> <span className="text-white">{pendingTurnosCount}</span></div>
                </div>

                <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="w-full h-16 bg-white text-black font-extrabold text-xl rounded-xl disabled:opacity-50 hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center"
                >
                    {isSyncing ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin mr-3" />
                            Enviando datos...
                        </>
                    ) : (
                        "Cargar Datos"
                    )}
                </button>
            </div>
            
            <p className="mt-8 text-zinc-600 font-medium max-w-sm">No puedes iniciar un nuevo turno hasta que estos datos sean sincronizados con el servidor.</p>
        </div>
    );
}
