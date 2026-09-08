import Image from "next/image";
import Link from "next/link";

export default function LandingNavbar() {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 sm:px-8 pointer-events-none">
      <header className="pointer-events-auto w-full max-w-[96%] h-14 px-6 sm:px-8 rounded-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.08)] flex items-center justify-between transition-all duration-300">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/shopliWhite.svg"
            alt="ShopLI"
            width={26}
            height={26}
            className="w-6 h-6 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
            priority
          />
          <span className="text-sm font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
            ShopLI
          </span>
        </Link>

        {/* Nav items */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-neutral-400">
          <a href="#capacidades" className="hover:text-white transition-colors">
            Capacidades
          </a>
          <a href="#offline" className="hover:text-white transition-colors">
            Offline-First
          </a>
          <a href="#auditorias" className="hover:text-white transition-colors">
            Auditorías
          </a>
          <a href="#precios" className="hover:text-white transition-colors">
            Precios
          </a>
        </nav>

        {/* Action buttons Glassmorphic */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-medium text-neutral-400 hover:text-white transition-colors px-2 py-1"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-xs font-medium text-white px-4 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.15] backdrop-blur-md transition-all duration-200 shadow-sm cursor-pointer"
          >
            Prueba gratis
          </Link>
        </div>
      </header>
    </div>
  );
}
