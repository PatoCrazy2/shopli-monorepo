"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Hook para detectar la dirección del scroll en el dashboard móvil.
 * Retorna `isHidden: true` cuando el usuario hace scroll hacia abajo (para ocultar barras),
 * y `isHidden: false` cuando el usuario hace scroll hacia arriba o está en el tope.
 */
export function useMobileScroll(containerId: string = "dashboard-scroll-container") {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    // Si estamos en un entorno sin window, no hacemos nada
    if (typeof window === "undefined") return;

    const container = document.getElementById(containerId) || window;

    const getScrollTop = () => {
      if (container === window) {
        return window.scrollY || document.documentElement.scrollTop;
      }
      return (container as HTMLElement).scrollTop;
    };

    const updateScrollDirection = () => {
      const currentScrollY = getScrollTop();
      const deltaY = currentScrollY - lastScrollY.current;

      // Si estamos en los primeros 25px de la página, siempre mostrar las barras
      if (currentScrollY <= 25) {
        setIsHidden(false);
      }
      // Scroll hacia abajo significativo (> 12px)
      else if (deltaY > 12) {
        setIsHidden(true);
      }
      // Scroll hacia arriba significativo (< -6px)
      else if (deltaY < -6) {
        setIsHidden(false);
      }

      lastScrollY.current = currentScrollY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [containerId]);

  return isHidden;
}
