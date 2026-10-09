"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Globe, MapPin, ChevronDown, Check, Loader2, Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

function getSafeDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DateSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = getSafeDateString(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getSafeDateString(yesterdayDate);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const effectiveValue = value || todayStr;
  const isToday = effectiveValue === todayStr;
  const isYesterday = effectiveValue === yesterdayStr;
  const isCustom = Boolean(effectiveValue && !isToday && !isYesterday);

  let displayLabel = "Hoy";
  if (isYesterday) displayLabel = "Ayer";
  else if (isCustom) displayLabel = effectiveValue;

  return (
    <div ref={containerRef} className="relative w-full sm:w-[180px] shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "w-full h-10 pl-3.5 pr-3 bg-white dark:bg-zinc-950 border rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 shadow-2xs transition-all flex items-center justify-between gap-2 cursor-pointer outline-none",
          open
            ? "border-zinc-900 ring-1 ring-zinc-900/10 dark:border-zinc-100 dark:ring-zinc-100/10"
            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className={cn("truncate", isCustom && "font-mono")}>{displayLabel}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0",
            open && "rotate-180 text-zinc-900 dark:text-zinc-100"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-full min-w-[190px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs font-sans"
        >
          <button
            type="button"
            role="option"
            aria-selected={isToday}
            onClick={() => {
              onChange(todayStr);
              setOpen(false);
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer",
              isToday
                ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <span>Hoy</span>
            {isToday && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
          </button>

          <button
            type="button"
            role="option"
            aria-selected={isYesterday}
            onClick={() => {
              onChange(yesterdayStr);
              setOpen(false);
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer",
              isYesterday
                ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <span>Ayer</span>
            {isYesterday && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
          </button>

          <div className="border-t border-zinc-100 dark:border-zinc-850 my-1 pt-1.5 px-2 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Otra fecha
            </span>
            <input
              type="date"
              value={effectiveValue}
              onChange={(e) => {
                if (e.target.value) {
                  onChange(e.target.value);
                  setOpen(false);
                }
              }}
              className="w-full h-8 px-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditsFilters({ 
  sucursales, 
  currentValue,
  currentDate,
}: { 
  sucursales: { id: string; nombre: string }[]; 
  currentValue?: string;
  currentDate?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = getSafeDateString(new Date());
  const selectedSucursal = sucursales.find((s) => s.id === currentValue);

  const handleSelectSucursal = (sucursalId: string) => {
    setIsOpen(false);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (sucursalId) {
        params.set("sucursalId", sucursalId);
      } else {
        params.delete("sucursalId");
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleSelectDate = (dateVal: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (dateVal && dateVal !== todayStr) {
        params.set("date", dateVal);
      } else {
        params.delete("date");
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleClear = () => {
    startTransition(() => {
      router.push(pathname);
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

  const isTodayActive = !currentDate || currentDate === todayStr;
  const hasActiveFilters = Boolean(currentValue || !isTodayActive);

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
      {/* 1. Selector de Sucursal */}
      <div className="relative flex-1 sm:w-[230px] sm:flex-initial min-w-0" ref={containerRef}>
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

          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-zinc-900 dark:text-zinc-100"
            )}
          />
        </button>

        {isOpen && (
          <div
            role="listbox"
            className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-full min-w-[220px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs font-sans"
          >
            <button
              type="button"
              role="option"
              aria-selected={!currentValue}
              onClick={() => handleSelectSucursal("")}
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

            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {sucursales.map((s) => {
                const isSelected = currentValue === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectSucursal(s.id)}
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

      {/* 2. Selector de Fecha */}
      <div className="flex-1 sm:flex-initial min-w-0">
        <DateSelect value={currentDate} onChange={handleSelectDate} />
      </div>

      {/* 3. Botón Limpiar Unificado */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClear}
          title="Restablecer filtros"
          className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-2xs"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      )}

      {/* 4. Indicador de Transición */}
      {isPending && (
        <div className="flex items-center pl-0.5 shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  );
}

export { AuditsFilters as SucursalFilter };
