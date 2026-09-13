import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

const DISMISSED_KEY = 'shopli_pwa_prompt_dismissed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredInstallPrompt) {
      return window.__deferredInstallPrompt;
    }
    return null;
  });

  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya corre en standalone PWA
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      return isDisplayStandalone || isNavigatorStandalone;
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);

    // 2. Detectar si el dispositivo es iOS (iPhone/iPad/iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 3. Revisar si la invitación fue descartada previamente
    const dismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    setIsDismissed(dismissed);

    // 4. Si ya existía el prompt capturado temprano en window, recuperarlo
    if (window.__deferredInstallPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__deferredInstallPrompt);
    }

    // 5. Listener para evento nativo beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const eventWithPrompt = e as BeforeInstallPromptEvent;
      window.__deferredInstallPrompt = eventWithPrompt;
      setDeferredPrompt(eventWithPrompt);
    };

    // 6. Listener para custom event de captura temprana en index.html
    const handlePromptAvailable = () => {
      if (window.__deferredInstallPrompt) {
        setDeferredPrompt(window.__deferredInstallPrompt);
      }
    };

    // 7. Listener para cuando la PWA se instala con éxito
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      window.__deferredInstallPrompt = null;
      setIsStandalone(true);
      setShowIOSGuide(false);
      setShowDesktopGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const dismissInvitation = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsDismissed(true);
  }, []);

  const promptInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Intentar obtener el prompt del estado local o del objeto global
    const activePrompt = deferredPrompt || window.__deferredInstallPrompt;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          window.__deferredInstallPrompt = null;
          dismissInvitation();
        }
      } catch (err) {
        console.error('Error al invocar prompt de instalación:', err);
        setShowDesktopGuide(true);
      }
    } else {
      // En Desktop o Android sin prompt nativo directo disponible, guiar adecuadamente
      setShowDesktopGuide(true);
    }
  }, [isIOS, deferredPrompt, dismissInvitation]);

  const canInstall = !isStandalone && (isIOS || !!deferredPrompt);
  const showInvitation = !isStandalone && !isDismissed;

  return {
    isStandalone,
    isIOS,
    canInstall,
    showInvitation,
    showIOSGuide,
    setShowIOSGuide,
    showDesktopGuide,
    setShowDesktopGuide,
    promptInstall,
    dismissInvitation,
  };
}
