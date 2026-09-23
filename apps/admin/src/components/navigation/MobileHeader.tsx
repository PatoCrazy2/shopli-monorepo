"use client";

import Link from "next/link";

interface MobileHeaderProps {
  user: {
    name?: string | null;
    role?: string;
    planBadge?: string | null;
  };
}

export function MobileHeader({ user }: MobileHeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 w-full z-40 bg-white/80 dark:bg-black/85 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 py-3 flex items-center justify-between shadow-xs">
      <Link href="/dashboard/inicio" className="flex items-center gap-2 active:scale-95 transition-transform">
        <img src="/shopli_snbg.svg" alt="ShopLI" className="w-6 h-6 object-contain" />
        <span className="font-bold text-lg tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
          ShopLI
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {user.planBadge && (
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border border-zinc-200/70 dark:border-zinc-800 ${
              user.planBadge.toLowerCase().includes("arranque")
                ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                : user.planBadge.toLowerCase().includes("crecimiento")
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : user.planBadge.toLowerCase().includes("multi") || user.planBadge.toLowerCase().includes("sucursal")
                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/40"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {user.planBadge}
          </span>
        )}
        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
          {user.role}
        </span>
      </div>
    </header>
  );
}
