"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, MapPin, ChevronDown, Check } from "lucide-react";

export function BranchFilter({
  branches,
}: {
  branches: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBranch = searchParams.get("branch") || "";
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBranch = branches.find((b) => b.id === currentBranch);

  const handleSelect = (branchId: string) => {
    setIsOpen(false);
    if (branchId) {
      router.push(`/dashboard/inventory?branch=${branchId}`);
    } else {
      router.push(`/dashboard/inventory`);
    }
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
    <div className="relative w-full sm:w-[280px]" ref={containerRef}>
      {/* Botón Trigger Estilizado */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-10 pl-3.5 pr-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 shadow-xs transition-colors flex items-center justify-between gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedBranch ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{selectedBranch.nombre}</span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">Todas las sucursales</span>
            </>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-zinc-900 dark:text-zinc-100" : ""
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
        >
          {/* Opción Consolidada */}
          <button
            type="button"
            role="option"
            aria-selected={!currentBranch}
            onClick={() => handleSelect("")}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer ${
              !currentBranch
                ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">Todas las sucursales (Consolidado)</span>
            </div>
            {!currentBranch && (
              <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
            )}
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-850" />

          {/* Opciones por Sucursal */}
          <div className="max-h-56 overflow-y-auto">
            {branches.map((b) => {
              const isSelected = currentBranch === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(b.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{b.nombre}</span>
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
