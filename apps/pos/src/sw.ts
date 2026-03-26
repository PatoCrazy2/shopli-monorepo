/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { pushToCloud } from './lib/sync-push';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any;
  addEventListener(
    type: 'sync',
    listener: (event: any) => void
  ): void;
};

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-pos-data') {
    console.log('[Service Worker] Background Sync ejecutándose: sync-pos-data');
    event.waitUntil(
      pushToCloud().then((result) => {
        if (!result.success && result.reason !== 'offline') {
          throw new Error(`Background sync failed: ${result.reason}`);
        } else if (result.success) {
          console.log('[Service Worker] Background Sync exitoso:', result.pushed);
        }
      })
    );
  }
});

import { pullFromCloud } from './lib/sync-pull';

self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'pull-catalog-daily') {
    console.log('[Service Worker] Periodic Background Sync ejecutándose: pull-catalog-daily');
    event.waitUntil(
      pullFromCloud().then((result) => {
          console.log('[Service Worker] Pull Periódico completado:', result);
      }).catch(err => {
          console.error('[Service Worker] Pull Periódico falló:', err);
      })
    );
  }
});
