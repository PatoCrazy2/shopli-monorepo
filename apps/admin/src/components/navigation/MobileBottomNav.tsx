"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Package, Wallet, Home, BarChart3, LayoutGrid } from "lucide-react";
import { MobileMoreDrawer } from "./MobileMoreDrawer";
import { useMobileScroll } from "@/hooks/useMobileScroll";

interface MobileBottomNavProps {
  user: {
    name?: string | null;
    role?: string;
    planBadge?: string | null;
  };
}

export function MobileBottomNav({ user }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const isHidden = useMobileScroll();

  // Limpiar pendingHref cuando la navegación concluye y el pathname cambia
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const activeHref = pendingHref || pathname;
  const isCatalog = activeHref.startsWith("/dashboard/catalog");
  const isCuts = activeHref.startsWith("/dashboard/cuts");
  const isHome = activeHref.startsWith("/dashboard/inicio");
  const isAnalytics = activeHref.startsWith("/dashboard/analytics");

  const handleTabClick = (href: string) => {
    if (!pathname.startsWith(href)) {
      setPendingHref(href);
    }
  };

  // Determine if active route is one of the secondary routes (in drawer)
  const isSecondaryActive =
    activeHref.startsWith("/dashboard/branches") ||
    activeHref.startsWith("/dashboard/inventory") ||
    activeHref.startsWith("/dashboard/sales") ||
    activeHref.startsWith("/dashboard/audits") ||
    activeHref.startsWith("/dashboard/gastos") ||
    activeHref.startsWith("/dashboard/users") ||
    activeHref.startsWith("/dashboard/billing");

  const shouldHide = isHidden && !isDrawerOpen;

  return (
    <>
      {/* Floating Bottom Dock */}
      <nav
        className={`md:hidden fixed bottom-3 inset-x-3 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xl shadow-zinc-950/10 dark:shadow-black/50 px-2 py-1.5 flex items-center justify-around select-none transition-all duration-300 ease-out ${
          shouldHide ? "translate-y-28 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
        aria-label="Navegación principal móvil"
      >
        {/* 1. Catálogo */}
        <Link
          href="/dashboard/catalog"
          onClick={() => handleTabClick("/dashboard/catalog")}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-0.5 rounded-xl transition-all duration-200 active:scale-95 relative ${
            isCatalog
              ? "text-zinc-950 dark:text-zinc-50 font-semibold"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Package className={`w-5 h-5 ${isCatalog ? "stroke-[2.5]" : "stroke-[1.8]"} ${pendingHref === "/dashboard/catalog" ? "animate-pulse text-zinc-900 dark:text-zinc-100" : ""}`} />
          <span className="text-[10px] tracking-tight">Catálogo</span>
          {pendingHref === "/dashboard/catalog" && (
            <span className="absolute bottom-0 w-1 h-1 bg-black dark:bg-white rounded-full animate-ping" />
          )}
        </Link>

        {/* 2. Cortes */}
        <Link
          href="/dashboard/cuts"
          onClick={() => handleTabClick("/dashboard/cuts")}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-0.5 rounded-xl transition-all duration-200 active:scale-95 relative ${
            isCuts
              ? "text-zinc-950 dark:text-zinc-50 font-semibold"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Wallet className={`w-5 h-5 ${isCuts ? "stroke-[2.5]" : "stroke-[1.8]"} ${pendingHref === "/dashboard/cuts" ? "animate-pulse text-zinc-900 dark:text-zinc-100" : ""}`} />
          <span className="text-[10px] tracking-tight">Cortes</span>
          {pendingHref === "/dashboard/cuts" && (
            <span className="absolute bottom-0 w-1 h-1 bg-black dark:bg-white rounded-full animate-ping" />
          )}
        </Link>

        {/* 3. Inicio (Hero / Center) */}
        <Link
          href="/dashboard/inicio"
          onClick={() => handleTabClick("/dashboard/inicio")}
          className="flex-1 flex flex-col items-center justify-center py-0.5 active:scale-90 transition-transform group relative"
          aria-label="Ir a Inicio"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
              isHome
                ? "bg-black text-white dark:bg-white dark:text-black ring-4 ring-zinc-200/50 dark:ring-zinc-800/80 scale-105"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-200"
            } ${pendingHref === "/dashboard/inicio" ? "animate-pulse" : ""}`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span
            className={`text-[9px] mt-0.5 tracking-tight ${
              isHome
                ? "font-bold text-zinc-950 dark:text-zinc-50"
                : "font-medium text-zinc-500 dark:text-zinc-400"
            }`}
          >
            Inicio
          </span>
          {pendingHref === "/dashboard/inicio" && (
            <span className="absolute bottom-0 w-1 h-1 bg-black dark:bg-white rounded-full animate-ping" />
          )}
        </Link>

        {/* 4. Analítica */}
        <Link
          href="/dashboard/analytics"
          onClick={() => handleTabClick("/dashboard/analytics")}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-0.5 rounded-xl transition-all duration-200 active:scale-95 relative ${
            isAnalytics
              ? "text-zinc-950 dark:text-zinc-50 font-semibold"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${isAnalytics ? "stroke-[2.5]" : "stroke-[1.8]"} ${pendingHref === "/dashboard/analytics" ? "animate-pulse text-zinc-900 dark:text-zinc-100" : ""}`} />
          <span className="text-[10px] tracking-tight">Analítica</span>
          {pendingHref === "/dashboard/analytics" && (
            <span className="absolute bottom-0 w-1 h-1 bg-black dark:bg-white rounded-full animate-ping" />
          )}
        </Link>

        {/* 5. Más (Drawer Hub) */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-0.5 rounded-xl transition-all duration-200 active:scale-95 ${
            isSecondaryActive || isDrawerOpen
              ? "text-zinc-950 dark:text-zinc-50 font-semibold"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
          aria-label="Abrir menú de más opciones"
        >
          <div className="relative">
            <LayoutGrid
              className={`w-5 h-5 ${
                isSecondaryActive || isDrawerOpen ? "stroke-[2.5]" : "stroke-[1.8]"
              }`}
            />
            {isSecondaryActive && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-black dark:bg-white rounded-full" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Más</span>
        </button>
      </nav>

      {/* Action Drawer */}
      <MobileMoreDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
      />
    </>
  );
}
