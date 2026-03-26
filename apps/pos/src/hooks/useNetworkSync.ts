import { useEffect, useCallback } from 'react';
import { pushToCloud } from '../lib/sync-push';
import { pullFromCloud } from '../lib/sync-pull';

export function useNetworkSync() {

  // 1. Foreground Push Listener: Ejecuta la capa visible cuando el internet regresa si la PWA sigue abierta
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Frontend detectó conexión restaurada. Intentando push inmediato en Foreground...');
      try {
        const result = await pushToCloud();
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

  // 2. Foreground Pull Interval & Focus: Pull silencioso mientras la app se usa
  useEffect(() => {
    const intervalMs = Number(import.meta.env.VITE_SYNC_INTERVAL_MS) || 180000; // Default 3 min
    
    // Polling contínuo si la app está abierta
    const intervalId = setInterval(() => {
        if (navigator.onLine) pullFromCloud();
    }, intervalMs);

    // Focus Listener: Gatillo cada vez que minimizan/abren la app o encienden pantalla
    const handleVisibilityChange = () => {
       if (document.visibilityState === 'visible' && navigator.onLine) {
           console.log('👀 App reactivada (Focus). Disparando Pull delta...');
           pullFromCloud();
       }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
        clearInterval(intervalId);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleVisibilityChange);
    };
  }, []);

  // 3. Registro Proactivo de Background Push Sync (ejecutado justo después de guardar en Dexie)
  const registerBackgroundSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const swRegistration = await navigator.serviceWorker.ready;
        await (swRegistration as any).sync.register('sync-pos-data');
      } catch (error) {
        console.warn('⚠️ Falló registro de Background Sync:', error);
      }
    }
  }, []);

  // 4. Registro Proactivo de Periodic Background Sync (Pull)
  useEffect(() => {
    const setupPeriodicSync = async () => {
       if ('serviceWorker' in navigator) {
         try {
           const swRegistration = await navigator.serviceWorker.ready;
           // Verificamos soporte de la API estandar (Chrome/Edge/PWA)
           if ('periodicSync' in swRegistration) {
              const status = await navigator.permissions.query({
                 name: 'periodic-background-sync' as PermissionName
              });
              
              if (status.state === 'granted') {
                 await (swRegistration as any).periodicSync.register('pull-catalog-daily', {
                    // Intenta despertar al Service Worker cada 12 horas 
                    // (El OS decide si ejecutarlo o no dependiendo la batería/internet)
                    minInterval: 12 * 60 * 60 * 1000 
                 });
                 console.log('⏰ Periodic Background Sync registrado (Pull de catálogo).');
              } else {
                 console.log('⏳ Permiso denegado para Periodic Background Sync.');
              }
           }
         } catch (err) {
            console.error('❌ Error configurando Periodic Pull Sync:', err);
         }
       }
    };
    setupPeriodicSync();
  }, []);

  return { registerBackgroundSync };
}
