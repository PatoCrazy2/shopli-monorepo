import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ShieldAlert, RefreshCw, Loader2, PhoneCall } from 'lucide-react';
import { db } from '../lib/db';
import { pullFromCloud } from '../lib/sync-pull';

export function SubscriptionSuspendedScreen() {
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryMessage, setRetryMessage] = useState<string | null>(null);

    // Consultar reactivamente la bandera de suspensión desde db.meta
    const isSuspended = useLiveQuery(async () => {
        const record = await db.meta.get('subscriptionSuspended');
        return Boolean(record?.value);
    }, []) ?? false;

    const handleRetry = async () => {
        setIsRetrying(true);
        setRetryMessage(null);

        try {
            const res = await pullFromCloud();
            if (res.source === 'cloud') {
                setRetryMessage("¡Suscripción activa! Restaurando acceso...");
            } else {
                // Sigue en suspensión o falló conexión
                const record = await db.meta.get('subscriptionSuspended');
                if (record?.value) {
                    setRetryMessage("La cuenta continúa en estado suspendido. Contacta al dueño.");
                } else {
                    setRetryMessage("No se pudo verificar el estado en línea.");
                }
            }
        } catch (_) {
            setRetryMessage("Error de conexión al verificar el estado.");
        } finally {
            setIsRetrying(false);
        }
    };

    if (!isSuspended) return null;

    return (
        <div className="fixed inset-0 z-[100000] bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center font-sans animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
                {/* Icono de Alerta de Suspensión */}
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border-4 border-rose-500/20 text-rose-500">
                    <ShieldAlert className="w-10 h-10 animate-bounce" />
                </div>

                {/* Título & Mensaje */}
                <h1 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight">
                    Servicio Suspendido
                </h1>

                <p className="text-zinc-400 text-sm sm:text-base mb-6 leading-relaxed">
                    La suscripción de ShopLI para tu empresa ha vencido o tiene un pago pendiente. La sincronización de este punto de venta se encuentra en pausa.
                </p>

                {/* Tarjeta Informativa para el Cajero */}
                <div className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
                    <PhoneCall className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-300">
                        <strong className="text-white block mb-0.5">Acción requerida:</strong>
                        Comunícate con el Administrador o Dueño de tu negocio para que reactive la suscripción desde el panel de control.
                    </div>
                </div>

                {retryMessage && (
                    <p className="text-xs font-semibold text-amber-400 mb-4 animate-in fade-in">
                        {retryMessage}
                    </p>
                )}

                {/* Botón de Comprobación Manual */}
                <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="w-full h-14 bg-white text-black font-extrabold text-base rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                    {isRetrying ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Verificando suscripción...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Verificar estado
                        </>
                    )}
                </button>
            </div>

            <p className="mt-6 text-xs text-zinc-500">ShopLI Point of Sale &bull; Resiliencia y Control SaaS</p>
        </div>
    );
}
