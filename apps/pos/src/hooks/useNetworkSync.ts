import { useEffect, useCallback } from 'react';
import { pushToCloud } from '../lib/sync-push';

export function useNetworkSync() {

  // 1. Foreground Listener: Ejecuta la capa visible cuando el internet regresa si la PWA sigue abierta
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Frontend detectó conexión restaurada. Intentando push inmediato en Foreground...');
      try {
        const result = await pushToCloud();
        
        // El sync_push ya se encarga de no hacer fetch si no hay length de pending items.
        // Si entra al if success, limpió los pendientes de IndexedDB.
        if (result.success && result.pushed) {
           const { turnos, ventas, auditorias } = result.pushed;
           if (turnos > 0 || ventas > 0 || auditorias > 0) {
               console.log(`✅ Foreground push exitoso: ${turnos} Turnos, ${ventas} Ventas, ${auditorias} Auditorías.`);
           }
        }
      } catch (err) {
        console.error('❌ Falló push en foreground', err);
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // 2. Registro Proactivo de Background Sync para el Service Worker (ejecutado justo después de guardar en Dexie)
  const registerBackgroundSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const swRegistration = await navigator.serviceWorker.ready;
        // Obligamos a TypeScript a aceptar la API 'sync'
        await (swRegistration as any).sync.register('sync-pos-data');
        console.log('📡 Evento Background Sync registrado con éxito (tag: sync-pos-data)');
      } catch (error) {
        console.warn('⚠️ Falló registro de Background Sync en este dispositivo:', error);
      }
    } else {
      console.log('⚡ Background Sync no está soportado (iOS/Safari o Dev). Solo confiar en Foreground Sync.');
    }
  }, []);

  return { registerBackgroundSync };
}
