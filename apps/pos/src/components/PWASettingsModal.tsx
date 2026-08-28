import { useState, useEffect } from 'react';
import { X, Wifi, WifiOff, RefreshCw, LogOut, Trash2 } from 'lucide-react';
import { db } from '../lib/db';

interface PWASettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWASettingsModal({ isOpen, onClose }: PWASettingsModalProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [resetConfirmStep, setResetConfirmStep] = useState(0); // 0: normal, 1: double confirmation active, 2: clearing/loading
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  // 1. Buscar actualización
  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          setUpdateStatus('Búsqueda de actualización finalizada.');
        } else {
          setUpdateStatus('No se encontró Service Worker activo.');
        }
      } else {
        setUpdateStatus('El navegador no soporta Service Workers.');
      }
    } catch (error) {
      console.error(error);
      setUpdateStatus('Error al buscar actualizaciones.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // 2. Desvincular dispositivo
  const handleUnlink = async () => {
    try {
      await db.meta.delete('empresaId');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('pos_shift');
      window.location.reload();
    } catch (error) {
      console.error('Error al desvincular dispositivo:', error);
      alert('Error al desvincular dispositivo.');
    }
  };

  // 3. Restablecer aplicación
  const handleResetApp = async () => {
    setResetConfirmStep(2);
    try {
      // Borrar IndexedDB
      await db.delete();

      // Borrar caché del navegador
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // Desregistrar Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      // Recargar la app a un estado completamente inicial
      window.location.reload();
    } catch (error) {
      console.error('Error al restablecer la aplicación:', error);
      alert('Error al restablecer la aplicación.');
      setResetConfirmStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white/90 p-6 shadow-2xl ring-1 ring-black/5 backdrop-blur-lg transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">Ajustes del Sistema (PWA)</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Diagnóstico y restablecimiento local</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Section */}
        <div className="my-5 flex items-center justify-between rounded-xl bg-zinc-50 p-4 border border-zinc-100">
          <span className="text-sm font-medium text-zinc-700">Estado de Conexión:</span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <Wifi size={14} /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200 animate-pulse">
                <WifiOff size={14} /> Offline
              </span>
            )}
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-4">
          {/* Action 1: Update Check */}
          <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Buscar Actualización</h3>
                <p className="text-xs text-zinc-500">Fuerza la comprobación de una nueva versión en el servidor.</p>
              </div>
              <button
                onClick={handleCheckUpdate}
                disabled={isCheckingUpdate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={13} className={isCheckingUpdate ? 'animate-spin' : ''} />
                {isCheckingUpdate ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {updateStatus && (
              <span className="text-xs font-medium text-blue-600 mt-1">{updateStatus}</span>
            )}
          </div>

          {/* Action 2: Unlink Account */}
          <div className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50/50 transition-colors">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Desvincular Dispositivo</h3>
              <p className="text-xs text-zinc-500">Quita la vinculación con la empresa actual y permite registrar otra cuenta.</p>
            </div>
            <button
              onClick={handleUnlink}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <LogOut size={13} />
              Desvincular
            </button>
          </div>

          {/* Action 3: Hard Reset App */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-rose-950">Restablecer Aplicación</h3>
                <p className="text-xs text-rose-700/80">Borra la base de datos local (IndexedDB), limpie el caché y reinstala la PWA.</p>
              </div>
              {resetConfirmStep === 0 && (
                <button
                  onClick={() => setResetConfirmStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                >
                  <Trash2 size={13} />
                  Restablecer
                </button>
              )}
            </div>

            {resetConfirmStep === 1 && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3">
                <p className="text-xs text-rose-900 font-medium mb-3">
                  ⚠️ ¿Estás seguro? Esta acción borrará todas las ventas no sincronizadas y datos locales permanentemente.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setResetConfirmStep(0)}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200 hover:bg-zinc-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResetApp}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                  >
                    Sí, restablecer
                  </button>
                </div>
              </div>
            )}

            {resetConfirmStep === 2 && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-rose-800">
                <RefreshCw size={12} className="animate-spin" />
                Borrando bases de datos y caché, por favor espera...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
