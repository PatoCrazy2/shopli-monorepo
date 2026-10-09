"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Globe, MapPin, ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

export function SucursalFilter({ 
  sucursales, 
  currentValue 
}: { 
  sucursales: { id: string; nombre: string }[]; 
  currentValue?: string; 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSucursal = sucursales.find((s) => s.id === currentValue);

  const handleSelect = (sucursalId: string) => {
    setIsOpen(false);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (sucursalId) {
        params.set("sucursalId", sucursalId);
      } else {
        params.delete("sucursalId");
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full sm:w-[260px] shrink-0" ref={containerRef}>
      {/* Botón Trigger Estilizado */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full h-10 pl-3.5 pr-3 bg-white dark:bg-zinc-950 border rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs transition-all flex items-center justify-between gap-2 cursor-pointer outline-none",
          isOpen
            ? "border-zinc-900 ring-1 ring-zinc-900/10 dark:border-zinc-100 dark:ring-zinc-100/10"
            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedSucursal ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{selectedSucursal.nombre}</span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">Todas las sucursales</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isPending && <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-zinc-400 transition-transform duration-200",
              isOpen && "rotate-180 text-zinc-900 dark:text-zinc-100"
            )}
          />
        </div>
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs font-sans"
        >
          {/* Opción Consolidada */}
          <button
            type="button"
            role="option"
            aria-selected={!currentValue}
            onClick={() => handleSelect("")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer",
              !currentValue
                ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">Todas las sucursales</span>
            </div>
            {!currentValue && (
              <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
            )}
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-850" />

          {/* Opciones por Sucursal */}
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {sucursales.map((s) => {
              const isSelected = currentValue === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(s.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer",
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{s.nombre}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
