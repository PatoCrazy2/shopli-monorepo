import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { pullFromCloud, pushToCloud } from '../lib/sync';
import { useAuth } from '../contexts/AuthContext';

export function useSync() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const isSyncingRef = useRef(false);

  // Reactividad: Expone el contador de ventas pendientes usando useLiveQuery (tiempo real en Dexie)
  const pendingCount = useLiveQuery(() => db.sales.count(), []) ?? 0;

  const triggerSync = useCallback(async () => {
    // Aborta silenciosamente si ya hay una sincronización corriendo o no hay internet
    if (isSyncingRef.current || !navigator.onLine) return;
    
    isSyncingRef.current = true;
    setIsSyncing(true);
    setLastError(null);

    try {
      // 1. Siempre bajamos cambios base más recientes para tener catálogo fresco
      await pullFromCloud();

      // 2. Si hay usuario autenticado y transacciones pendientes que subir
      if (user?.id && pendingCount > 0) {
        const result = await pushToCloud();
        
        if (!result.success && result.reason === 'offline') {
          setLastError("Sin conexión con el servidor principal.");
        } else if (!result.success) {
          setLastError(`Error de sincronización: ${result.reason || "Desconocido"}.`);
        }
      }

      setLastSyncAt(new Date());

    } catch (err) {
      setLastError(err instanceof Error ? err.message : "Error fatal de la red de Sincronización.");
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [user?.id, pendingCount]);

  useEffect(() => {
    // Pull inicial al montar: baja el catálogo fresco desde el servidor
    triggerSync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar — no incluir triggerSync en deps para evitar re-disparo

  useEffect(() => {
    // Limpieza/registro de observador de línea para reactividad instantánea
    window.addEventListener("online", triggerSync);
    
    // Intervalo de barrido recurrente automático (por defecto 3 mins)
    const SYNC_TIMER = Number(import.meta.env.VITE_SYNC_INTERVAL_MS) || 180000;
    const intervalId = setInterval(triggerSync, SYNC_TIMER);

    return () => {
      window.removeEventListener("online", triggerSync);
      clearInterval(intervalId);
    };
  }, [triggerSync]);

  return { isSyncing, lastSyncAt, pendingCount, lastError, triggerSync };
}
