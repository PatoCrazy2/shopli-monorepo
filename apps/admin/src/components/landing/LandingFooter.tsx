"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="relative w-full overflow-hidden bg-[#050507] text-white border-t border-white/[0.08] select-none">
      {/* Background del Hero sutil y atmosférico en el fondo del footer */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <Image
          src="/shopli-new-hero.webp"
          alt="ShopLI Ambient Background"
          fill
          className="object-cover object-bottom opacity-35"
        />
        {/* Degradado superior y viñeta para fundido imperceptible con el negro de la página */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050507] via-[#050507]/80 to-[#050507]/95" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-16 pb-12">
        {/* Cuadrícula Principal de 4 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-white/[0.06]">
          {/* Columna 1: Marca y Propuesta de Valor (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <Link
              href="/"
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="flex items-center gap-2.5 mb-4 group cursor-pointer"
            >
              <Image
                src="/shopliWhite.svg"
                alt="ShopLI Logo"
                width={26}
                height={26}
                className="w-6 h-6 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-lg font-semibold tracking-tight text-white">
                ShopLI
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm mb-6">
              Punto de venta Offline-First y plataforma de analítica en la nube para
              comercios y cadenas de alta demanda.
            </p>

            <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
              Arquitectura de latencia cero · Cero pérdida de ventas
            </p>
          </div>

          {/* Columna 2: Producto (3 cols) */}
          <div className="lg:col-span-3 flex flex-col items-start">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-semibold mb-4 block">
              Producto
            </span>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("capacidades")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Capacidades del Sistema
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("offline")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terminal Offline-First
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("auditorias")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Auditorías Dinámicas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("precios")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Planes & Precios
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("faq")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Preguntas Frecuentes
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Plataforma (2 cols) */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-semibold mb-4 block">
              Plataforma
            </span>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link
                  href="/login"
                  className="hover:text-white transition-colors block"
                >
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-white transition-colors block"
                >
                  Prueba gratis
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection("contacto")}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Asesoría & Contacto
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 4: Legal & Seguridad (2 cols) */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-semibold mb-4 block">
              Legal & Datos
            </span>
            <ul className="space-y-2.5 text-xs text-neutral-400 mb-4">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors block"
                >
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors block"
                >
                  Aviso de privacidad
                </Link>
              </li>
            </ul>
            <p className="text-[11px] text-neutral-500 leading-normal">
              Transacciones inmutables y sincronización cifrada de extremo a extremo.
            </p>
          </div>
        </div>

        {/* Barra Inferior (Bottom Bar) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p className="text-center sm:text-left">
            © {currentYear} ShopLI. Todos los derechos reservados.
          </p>
          <p className="text-center sm:text-right font-mono text-[11px]">
            Diseñado para operar con latencia cero con o sin internet.
          </p>
        </div>
      </div>
    </footer>
  );
}
