import Image from "next/image";
import Link from "next/link";

export default function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full h-16 bg-[#050507]/40 backdrop-blur-xl border-b border-white/[0.04] transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto h-full px-6 sm:px-12 flex items-center justify-between">
        {/* Brand: Muestra el nombre por defecto y cambia suavemente al logo al hacer hover */}
        <Link href="/" className="relative flex items-center h-8 group select-none">
          {/* Texto ShopLI (se desvanece en hover) */}
          <span className="text-base font-semibold tracking-tight text-white/90 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-1">
            ShopLI
          </span>

          {/* Logo SVG (aparece en hover en la misma posición) */}
          <div className="absolute inset-0 flex items-center opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <Image
              src="/shopliWhite.svg"
              alt="ShopLI Logo"
              width={26}
              height={26}
              className="w-6 h-6 object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]"
              priority
            />
          </div>
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
            className="text-xs font-medium text-white px-4 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.1] backdrop-blur-md transition-all duration-200 shadow-sm cursor-pointer"
          >
            Prueba gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
