import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Registrar el Service Worker globalmente y preparar listeners para Background Sync
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })

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

    // Buscar actualizaciones cada 60 minutos
    setInterval(() => {
      registration.update().catch((err) => {
        console.error('[SW] Error al buscar actualizaciones programadas:', err);
      });
    }, 60 * 60 * 1000); // 60 minutos
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
