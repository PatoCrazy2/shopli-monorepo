import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { KeyRound, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { db, purgeAllTenantData } from '../lib/db';

export function DeviceRevokedScreen() {
    const [isResetting, setIsResetting] = useState(false);

    // Consultar reactivamente la bandera de revocación de token desde db.meta
    const isRevoked = useLiveQuery(async () => {
        const record = await db.meta.get('tokenRevoked');
        return Boolean(record?.value);
    }, []) ?? false;

    const handleRelink = async () => {
        setIsResetting(true);
        try {
            // Limpiar datos locales y desvincular para reiniciar en modo configuración
            localStorage.removeItem('auth_user');
            localStorage.removeItem('pos_shift');
            await purgeAllTenantData();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error al revincular terminal:', error);
            setIsResetting(false);
        }
    };

    if (!isRevoked) return null;

    return (
        <div className="fixed inset-0 z-[100001] bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center font-sans animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
                {/* Icono de Alerta de Revocación */}
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border-4 border-amber-500/20 text-amber-500">
                    <KeyRound className="w-10 h-10 animate-pulse" />
                </div>

                {/* Título & Mensaje */}
                <h1 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight">
                    Dispositivo Desvinculado
                </h1>

                <p className="text-zinc-400 text-sm sm:text-base mb-6 leading-relaxed">
                    La sesión de sincronización de este terminal ha sido revocada o la clave de seguridad de tu empresa cambió. Es necesario volver a vincular este punto de venta.
                </p>

                {/* Tarjeta Informativa */}
                <div className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-300">
                        <strong className="text-white block mb-0.5">Re-vinculación requerida:</strong>
                        Haz clic en &quot;Re-vincular terminal&quot; para ingresar nuevamente con tu Correo y PIN de acceso autorizado.
                    </div>
                </div>

                {/* Botón de Re-vinculación */}
                <button
                    onClick={handleRelink}
                    disabled={isResetting}
                    className="w-full h-14 bg-white text-black font-extrabold text-base rounded-2xl hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                    {isResetting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Preparando re-vinculación...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Re-vincular terminal
                        </>
                    )}
                </button>
            </div>

            <p className="mt-6 text-xs text-zinc-500">ShopLI Point of Sale &bull; Seguridad Multi-Tenant</p>
        </div>
    );
}
