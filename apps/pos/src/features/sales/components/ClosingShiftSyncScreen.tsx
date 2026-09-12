import { useLiveQuery } from 'dexie-react-hooks';
import { Loader2, ArrowRight } from 'lucide-react';
import { db } from '../../../lib/db';

export function ClosingShiftSyncScreen() {
    const closingSyncRecord = useLiveQuery(async () => {
        const record = await db.meta.get('isClosingShiftSync');
        return record?.value as 'syncing' | 'success' | null;
    }, []) ?? null;

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
                            <ArrowRight className="w-9 h-9 text-white stroke-[2.5]" />
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
                            Redirigiendo a inicio de sesión...
                        </p>
                    </>
                )}

                {/* Indicador inferior sutil */}
                <div className="mt-12">
                    <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-zinc-200/60 text-zinc-600 uppercase tracking-wider">
                        {closingSyncRecord === 'syncing' ? 'Conexión Segura' : 'Completado'}
                    </span>
                </div>
            </div>
        </div>
    );
}
