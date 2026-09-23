"use client";

import { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X, Sparkles, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);

    // Detectar si ya está en modo standalone (instalada)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detectar iOS / Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Escuchar evento beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Escuchar cuando se instale la app
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem("shopli_pwa_installed", "true");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        localStorage.setItem("shopli_pwa_installed", "true");
      }
      setDeferredPrompt(null);
    }
  };

  return {
    isMounted,
    isInstalled,
    isIOS,
    canInstallNative: !!deferredPrompt,
    installApp,
  };
}

/**
 * Modal de Novedades (Opción C acordada)
 * Aparece la primera vez si la app no está instalada y ofrece instalarla o cerrarla.
 */
export function PwaInstallModal() {
  const { isMounted, isInstalled, isIOS, canInstallNative, installApp } = usePwaInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (!isMounted || isInstalled) return;

    const dismissed = localStorage.getItem("shopli_pwa_modal_dismissed");
    if (!dismissed) {
      // Breve retardo de cortesía para una entrada visual suave estilo Apple
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isMounted, isInstalled]);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("shopli_pwa_modal_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
    } else if (canInstallNative) {
      await installApp();
      handleDismiss();
    } else {
      // Para navegadores desktop o casos especiales sin evento automático
      setShowIosGuide(true);
    }
  };

  if (!isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden transition-all transform scale-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header con icono Apple-like */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-lg p-3 mb-5 border border-zinc-200/20">
            <img src="/shopli_snbg.svg" alt="ShopLI App Icon" className="w-12 h-12 invert dark:invert-0" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Novedad en ShopLI</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Lleva ShopLI en tu pantalla de inicio
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Instala la aplicación web para disfrutar de pantalla completa, acceso instantáneo y una experiencia rápida y fluida sin barras de navegador.
          </p>
        </div>

        {/* Guía interactiva para iOS si se solicita */}
        {showIosGuide ? (
          <div className="mt-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-left animate-in slide-in-from-bottom-2 duration-200">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-2">
              Pasos para instalar en Safari (iOS):
            </p>
            <ol className="text-xs text-zinc-600 dark:text-zinc-300 space-y-2.5">
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 font-bold text-[10px]">1</span>
                <span>Toca el botón <strong>Compartir</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> en la barra de Safari.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 font-bold text-[10px]">2</span>
                <span>Desplázate hacia abajo y elige <strong>&quot;Añadir a pantalla de inicio&quot;</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1" />.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 font-bold text-[10px]">3</span>
                <span>Toca <strong>Añadir</strong> en la esquina superior derecha.</span>
              </li>
            </ol>
            <button
              type="button"
              onClick={handleDismiss}
              className="mt-4 w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            >
              ¡Entendido!
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Aplicación</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
            >
              Quizás más tarde
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Botón permanente de instalación al final del Sidebar
 * Permite al usuario instalar la PWA si rechazó el modal o si desea instalarla en cualquier momento.
 */
export function PwaInstallSidebarButton({ isCollapsed }: { isCollapsed: boolean }) {
  const { isMounted, isInstalled, isIOS, canInstallNative, installApp } = usePwaInstall();
  const [showSheet, setShowSheet] = useState(false);

  if (!isMounted || isInstalled) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowSheet(true);
    } else if (canInstallNative) {
      await installApp();
    } else {
      setShowSheet(true);
    }
  };

  return (
    <>
      <div className="px-3 py-1">
        <button
          type="button"
          onClick={handleClick}
          title="Instalar ShopLI en este dispositivo"
          className={`
            flex items-center gap-2.5 w-full rounded-xl transition-all duration-200 cursor-pointer
            border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800
            text-zinc-800 dark:text-zinc-200 shadow-sm
            ${isCollapsed ? "justify-center p-2.5" : "px-3 py-2 text-xs font-semibold"}
          `}
        >
          <div className="w-6 h-6 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
            <Download className="w-3.5 h-3.5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col text-left truncate">
              <span className="truncate">Instalar App</span>
              <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">Acceso rápido</span>
            </div>
          )}
        </button>
      </div>

      {/* Sheet minimalista para instrucciones en iOS / Desktop manual */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowSheet(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
                <img src="/shopli_snbg.svg" alt="Shopli" className="w-6 h-6 invert dark:invert-0" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Instalar ShopLI</h4>
                <p className="text-xs text-zinc-500">Pantalla de inicio</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {isIOS
                    ? "Toca el botón Compartir en Safari y selecciona 'Añadir a pantalla de inicio'."
                    : "En tu navegador, haz clic en el ícono de instalación en la barra de direcciones o en el menú."}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSheet(false)}
              className="mt-5 w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
