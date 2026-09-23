"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  MapPin,
  Layers,
  ShoppingBag,
  ClipboardList,
  Receipt,
  Users,
  CreditCard,
  LogOut,
  X,
  Loader2,
} from "lucide-react";

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name?: string | null;
    role?: string;
    planBadge?: string | null;
  };
}

export function MobileMoreDrawer({ isOpen, onClose, user }: MobileMoreDrawerProps) {
  const pathname = usePathname();
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);

  // Cerrar el cajón ÚNICAMENTE cuando la ruta destino haya terminado de cargar (cambio de pathname)
  useEffect(() => {
    if (isOpen && navigatingHref) {
      setNavigatingHref(null);
      onClose();
    }
  }, [pathname]);

  // Si el usuario cierra el cajón manualmente (con la 'X' o tocando el fondo)
  useEffect(() => {
    if (!isOpen) {
      setNavigatingHref(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isOwner = user.role === "DUENO";

  const operationsLinks = [
    { name: "Inventario", href: "/dashboard/inventory", icon: Layers },
    { name: "Ventas", href: "/dashboard/sales", icon: ShoppingBag },
    { name: "Auditorías", href: "/dashboard/audits", icon: ClipboardList },
    { name: "Gastos", href: "/dashboard/gastos", icon: Receipt },
  ];

  const handleLinkClick = (href: string) => {
    // Si ya estamos en esa página, cerramos de inmediato
    if (pathname === href) {
      onClose();
      return;
    }
    // Mantiene el cajón abierto mostrando el spinner hasta que Next.js cargue la nueva página
    setNavigatingHref(href);
  };

  return (
    <div className="md:hidden fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => {
          if (!navigatingHref) onClose();
        }}
        aria-hidden="true"
      />

      {/* Bottom Sheet Modal */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 max-h-[85vh] bg-white dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800 rounded-t-[28px] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Menú y aplicaciones secundarias"
      >
        {/* Header con indicador de arrastre */}
        <div className="pt-3 px-6 pb-2 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex-1 flex justify-center pl-6">
            <div className="w-10 h-1.25 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto px-5 py-4 space-y-6 pb-10">
          {/* Sección 1: Mi Negocio / Sucursales */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 px-1">
              Mi Negocio
            </h3>
            {(() => {
              const isBranches = pathname.startsWith("/dashboard/branches");
              const isLoading = navigatingHref === "/dashboard/branches";
              return (
                <Link
                  href="/dashboard/branches"
                  onClick={() => handleLinkClick("/dashboard/branches")}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.98] ${
                    isLoading
                      ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 ring-2 ring-black dark:ring-white"
                      : isBranches
                      ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-black dark:text-white" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {isLoading ? "Cargando..." : "Sucursales"}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Gestionar ubicaciones y cajas
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-zinc-400">
                    {isLoading ? "..." : "Abrir →"}
                  </span>
                </Link>
              );
            })()}
          </div>

          {/* Sección 2: Operaciones */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 px-1">
              Operaciones & Control
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {operationsLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                const isLoading = navigatingHref === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleLinkClick(item.href)}
                    className={`flex flex-col gap-2 p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                      isLoading
                        ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 ring-2 ring-black dark:ring-white scale-[0.98]"
                        : isActive
                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-black dark:text-white" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${
                          isActive
                            ? "text-white dark:text-zinc-900"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      />
                    )}
                    <span className="font-medium text-xs">
                      {isLoading ? "Cargando..." : item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sección 3: Equipo & Facturación */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 px-1">
              Gestión & Cuenta
            </h3>
            <div className="space-y-1.5">
              {(() => {
                const isUsers = pathname.startsWith("/dashboard/users");
                const isLoading = navigatingHref === "/dashboard/users";
                return (
                  <Link
                    href="/dashboard/users"
                    onClick={() => handleLinkClick("/dashboard/users")}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all active:scale-[0.98] ${
                      isLoading
                        ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 ring-2 ring-black dark:ring-white"
                        : isUsers
                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black dark:text-white" />
                    ) : (
                      <Users className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    )}
                    <span className="text-sm font-medium">
                      {isLoading ? "Cargando usuarios..." : "Usuarios & Cajeros"}
                    </span>
                  </Link>
                );
              })()}

              {isOwner && (() => {
                const isBilling = pathname.startsWith("/dashboard/billing");
                const isLoading = navigatingHref === "/dashboard/billing";
                return (
                  <Link
                    href="/dashboard/billing"
                    onClick={() => handleLinkClick("/dashboard/billing")}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all active:scale-[0.98] ${
                      isLoading
                        ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 ring-2 ring-black dark:ring-white"
                        : isBilling
                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black dark:text-white" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    )}
                    <span className="text-sm font-medium">
                      {isLoading ? "Cargando plan..." : "Suscripción & Plan"}
                    </span>
                  </Link>
                );
              })()}
            </div>
          </div>

          {/* Footer: Usuario & Cerrar sesión */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                {user.name || "Usuario"}
              </span>
              <span className="text-[11px] text-zinc-500">
                Rol: {user.role}
              </span>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
