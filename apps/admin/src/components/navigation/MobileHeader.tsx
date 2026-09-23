"use client";

import Link from "next/link";
import Image from "next/image";
import { useMobileScroll } from "@/hooks/useMobileScroll";

interface MobileHeaderProps {
  user: {
    name?: string | null;
    role?: string;
    planBadge?: string | null;
  };
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const isHidden = useMobileScroll();

  return (
    <header
      className={`md:hidden fixed top-0 left-0 w-full z-40 bg-white/80 dark:bg-black/85 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 py-3 flex items-center justify-between shadow-xs transition-transform duration-300 ease-out ${
        isHidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {/* Lado izquierdo: Logotipo intacto */}
      <Link href="/dashboard/inicio" className="flex items-center gap-2 shrink-0 active:scale-95 transition-transform">
        <Image src="/shopli_snbg.svg" alt="ShopLI" width={24} height={24} className="w-6 h-6 object-contain" />
        <span className="font-bold text-lg tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
          ShopLI
        </span>
      </Link>

      {/* Lado derecho: Saludo y Nombre del usuario */}
      <div className="flex items-center max-w-[65%] justify-end pl-2">
        <span className="font-bold text-base sm:text-lg tracking-tight text-zinc-950 dark:text-zinc-50 font-sans truncate">
          <span className="font-normal text-zinc-500 dark:text-zinc-400">Bienvenido, </span>
          {user.name || "Usuario"}
        </span>
      </div>
    </header>
  );
}
