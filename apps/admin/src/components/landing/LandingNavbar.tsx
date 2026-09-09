"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar menú al redimensionar a pantalla grande
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Bloquear scroll cuando el menú está abierto en móvil
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 w-full h-16 bg-[#050507]/60 backdrop-blur-xl border-b border-white/[0.05] transition-all duration-300 animate-slide-down"
        style={{ animationDelay: "1.9s" }}
      >
        <div className="w-full max-w-7xl mx-auto h-full px-6 sm:px-12 flex items-center justify-between">
          {/* Brand: Muestra el nombre por defecto y cambia suavemente al logo al hacer hover */}
          <Link
            href="/"
            onClick={(e) => {
              // Si ya estamos en la página de inicio, hacer scroll suave al Hero
              if (window.location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="relative flex items-center h-8 group select-none cursor-pointer"
          >
            <span className="text-base font-semibold tracking-tight text-white/90 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-1">
              ShopLI
            </span>
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

          {/* Nav items Desktop */}
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

          {/* Action buttons Desktop & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
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

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 -mr-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Side Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-[#07070a] border-l border-white/[0.08] p-6 flex flex-col justify-between transition-transform duration-300 ease-out md:hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          {/* Header del drawer */}
          <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
            <span className="text-sm font-semibold tracking-tight text-white">Navegación</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Links de navegación */}
          <nav className="flex flex-col gap-4 mt-6">
            <a
              href="#capacidades"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors py-1.5"
            >
              Capacidades
            </a>
            <a
              href="#offline"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors py-1.5"
            >
              Offline-First
            </a>
            <a
              href="#auditorias"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors py-1.5"
            >
              Auditorías
            </a>
            <a
              href="#precios"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors py-1.5"
            >
              Precios
            </a>
          </nav>
        </div>

        {/* Acciones inferiores del drawer */}
        <div className="flex flex-col gap-3 pt-6 border-t border-white/[0.06]">
          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className="w-full text-center py-2.5 text-xs font-medium text-neutral-300 hover:text-white rounded-xl bg-white/[0.04] border border-white/[0.06] transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            onClick={() => setIsOpen(false)}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-white rounded-xl bg-white/[0.12] hover:bg-white/[0.18] border border-white/[0.15] transition-colors shadow-sm"
          >
            <span>Prueba gratis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </>
  );
}
