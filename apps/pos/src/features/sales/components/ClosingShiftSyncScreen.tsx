import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2, Check } from 'lucide-react';
import { db } from '../../../lib/db';
import { useAuth } from '../../../contexts/AuthContext';

export function ClosingShiftSyncScreen() {
    const { logout } = useAuth();
    const [countdown, setCountdown] = useState(4);
    const hasNavigated = useRef(false);

    const closingSyncRecord = useLiveQuery(async () => {
        const record = await db.meta.get('isClosingShiftSync');
        return record?.value as 'syncing' | 'success' | null;
    }, []) ?? null;

    const navigateToLogin = async () => {
        if (hasNavigated.current) return;
        hasNavigated.current = true;
        await db.meta.delete('isClosingShiftSync');
        logout();
        if (typeof window !== 'undefined') {
            window.location.replace('/login');
        }
    };

    useEffect(() => {
        if (closingSyncRecord === 'success') {
            hasNavigated.current = false;
            setCountdown(4);

            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        navigateToLogin();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [closingSyncRecord]);

    if (!closingSyncRecord) return null;

    return (
        <div className="fixed inset-0 z-[99999] min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 selection:bg-black selection:text-white font-sans text-center">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Header idéntico al Login */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black tracking-tight text-black mb-1">
                        ShopLI <span className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">POS</span>
                    </h1>
                </div>

                {/* Icono central de estado */}
                <div className="mb-8">
                    {closingSyncRecord === 'syncing' ? (
                        <div className="w-20 h-20 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
                            <Loader2 className="w-9 h-9 text-black animate-spin" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-black text-white shadow-md flex items-center justify-center">
                            <Check className="w-10 h-10 text-white stroke-[3]" />
                        </div>
                    )}
                </div>

                {/* Títulos y descripciones */}
                {closingSyncRecord === 'syncing' ? (
                    <>
                        <h2 className="text-3xl font-black tracking-tight text-zinc-900 mb-3">
                            Sincronizando...
                        </h2>
                        <p className="text-zinc-500 text-base leading-relaxed max-w-sm">
                            Turno cerrado correctamente. Subiendo ventas, inventario y registros al servidor central.
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-3xl font-black tracking-tight text-zinc-900 mb-3">
                            ¡Turno sincronizado correctamente!
                        </h2>
                        <p className="text-zinc-500 text-base leading-relaxed max-w-sm">
                            Todos los datos han sido respaldados en la nube.
                        </p>

                        {/* Botón táctil híbrido: acción inmediata o espera con cuenta regresiva */}
                        <button
                            onClick={navigateToLogin}
                            className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-black text-white font-semibold text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm"
                        >
                            <span>Ir al inicio ahora</span>
                            <span className="text-zinc-400 font-normal">({countdown}s)</span>
                        </button>
                    </>
                )}

                {/* Indicador inferior sutil */}
                <div className="mt-10">
                    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-zinc-200/60 text-zinc-600 uppercase tracking-wider">
                        {closingSyncRecord === 'syncing' ? 'Conexión Segura' : 'Completado'}
                    </span>
                </div>
            </div>
        </div>
    );
}
