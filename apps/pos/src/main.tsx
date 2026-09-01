import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Registrar el Service Worker globalmente y preparar listeners para Background Sync
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[SW] Nueva versión detectada y lista.');
    },
  });

  // Cuando el nuevo SW tome el control con clientsClaim(), recargar suavemente para usar el nuevo JS
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[SW] Controlador actualizado, recargando aplicación...');
      window.location.reload();
    }
  });

  navigator.serviceWorker.ready.then((registration) => {
    // Buscar actualizaciones proactivamente al iniciar
    registration.update().catch((err) => {
      console.error('[SW] Error al buscar actualizaciones iniciales:', err);
    });

    // Buscar actualizaciones al recuperar el foco (visibilitychange)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch((err) => {
          console.error('[SW] Error al buscar actualizaciones por cambio de visibilidad:', err);
        });
      }
    });

    // Buscar actualizaciones cada 15 minutos en vez de 60
    setInterval(() => {
      registration.update().catch((err) => {
        console.error('[SW] Error al buscar actualizaciones programadas:', err);
      });
    }, 15 * 60 * 1000); // 15 minutos
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
