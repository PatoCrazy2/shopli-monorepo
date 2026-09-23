"use client";

// Componentes desacoplados / deshabilitados a petición del usuario.
// Retornan null para prevenir errores de Turbopack HMR en chunks cacheados.

export function PwaInstallModal() {
  return null;
}

export function PwaInstallSidebarButton(_props?: { isCollapsed?: boolean }) {
  return null;
}

export function usePwaInstall() {
  return {
    isMounted: false,
    isInstalled: true,
    isIOS: false,
    isDesktop: false,
    canInstallNative: false,
    installApp: async () => {},
  };
}
