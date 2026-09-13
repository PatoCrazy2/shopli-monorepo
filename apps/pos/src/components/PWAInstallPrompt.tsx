import { Download, X, Share, PlusSquare, ArrowUpRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const {
    isStandalone,
    showInvitation,
    showIOSGuide,
    setShowIOSGuide,
    promptInstall,
    dismissInvitation,
  } = usePWAInstall();

  // Si ya se está ejecutando como PWA instalada, no renderizar nada
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Botón superior derecho y Tooltip de Invitación */}
      <div className="fixed top-4 right-4 z-40 flex flex-col items-end">
        {/* Botón Discreto de Descarga / Instalación */}
        <button
          type="button"
          onClick={promptInstall}
          aria-label="Instalar aplicación"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 text-xs sm:text-sm font-semibold shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-black/10"
        >
          <Download className="w-4 h-4 text-zinc-600 flex-shrink-0" />
          <span>Instalar app</span>
        </button>

        {/* Modal chico / Tooltip con flecha apuntando al botón */}
        {showInvitation && (
          <div className="relative mt-3 w-72 sm:w-80 bg-white border border-zinc-200 rounded-2xl p-4 shadow-xl text-left animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Indicador visual / Flecha orientada al botón */}
            <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-t border-l border-zinc-200 transform rotate-45" />

            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 tracking-tight">
                <ArrowUpRight className="w-4 h-4 text-black animate-bounce" />
                <span>¿Deseas instalar la app?</span>
              </div>
              <button
                type="button"
                onClick={dismissInvitation}
                className="text-zinc-400 hover:text-zinc-600 rounded-lg p-0.5 hover:bg-zinc-100 transition-colors"
                aria-label="Cerrar invitación"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed mb-4 font-normal">
              Añade ShopLI POS a tu pantalla de inicio para acceder de inmediato y seguir cobrando incluso sin conexión a internet.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={dismissInvitation}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-800 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Ahora no
              </button>
              <button
                type="button"
                onClick={promptInstall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold shadow-sm hover:bg-zinc-800 active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar ahora</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal instruccional para iOS (Safari) */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 max-w-sm w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1 rounded-full hover:bg-zinc-100 transition-colors"
              aria-label="Cerrar guía"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 tracking-tight">Instalar en tu iPhone o iPad</h3>
                <p className="text-xs text-zinc-500">Agrega ShopLI POS a tu inicio</p>
              </div>
            </div>

            <div className="space-y-3.5 my-5 text-xs text-zinc-700">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-relaxed">
                  Pulsa el botón de <strong className="text-zinc-900 inline-flex items-center gap-1 font-semibold"><Share className="w-3.5 h-3.5 text-blue-600" /> Compartir</strong> en la barra inferior de Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-relaxed">
                  Desliza hacia abajo y elige <strong className="text-zinc-900 inline-flex items-center gap-1 font-semibold"><PlusSquare className="w-3.5 h-3.5" /> Agregar a la pantalla de inicio</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-relaxed">
                  Confirma tocando <strong className="text-zinc-900 font-semibold">"Agregar"</strong> en la esquina superior derecha.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 bg-black text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
