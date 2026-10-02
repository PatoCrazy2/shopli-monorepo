"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Check, X, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface Sucursal {
  id: string;
  nombre: string;
}

interface CustomSelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={containerRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-8 px-2.5 w-full rounded-lg border font-mono text-xs flex items-center justify-between gap-1.5 transition-all outline-none cursor-pointer",
          open
            ? "border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10"
            : "border-zinc-200 bg-zinc-50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={12} className={cn("text-zinc-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[190px] max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 text-xs font-mono animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between text-xs cursor-pointer",
              value === ""
                ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
            )}
          >
            <span>{placeholder}</span>
            {value === "" && <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
          </button>

          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between text-xs cursor-pointer",
                value === opt.value
                  ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
              )}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getSafeDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DateSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (date: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = getSafeDateString(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getSafeDateString(yesterdayDate);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const isToday = value === todayStr;
  const isYesterday = value === yesterdayStr;
  const isCustom = Boolean(value && !isToday && !isYesterday);

  let displayLabel = "Hoy";
  if (isYesterday) displayLabel = "Ayer";
  else if (isCustom) displayLabel = value;

  return (
    <div ref={containerRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-8 px-2.5 w-full rounded-lg border font-mono text-xs flex items-center justify-between gap-1.5 transition-all outline-none cursor-pointer",
          open
            ? "border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10"
            : "border-zinc-200 bg-zinc-50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        )}
      >
        <span className="truncate flex items-center gap-1.5">
          <CalendarIcon size={12} className="text-zinc-400 shrink-0" />
          <span>{displayLabel}</span>
        </span>
        <ChevronDown size={12} className={cn("text-zinc-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 text-xs font-mono animate-in fade-in zoom-in-95 duration-100">
          {/* Opción: Hoy */}
          <button
            type="button"
            onClick={() => {
              onChange(todayStr);
              setOpen(false);
            }}
            className={cn(
              "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between text-xs cursor-pointer",
              isToday
                ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
            )}
          >
            <span>Hoy</span>
            {isToday && <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
          </button>

          {/* Opción: Ayer */}
          <button
            type="button"
            onClick={() => {
              onChange(yesterdayStr);
              setOpen(false);
            }}
            className={cn(
              "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between text-xs cursor-pointer",
              isYesterday
                ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
            )}
          >
            <span>Ayer</span>
            {isYesterday && <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
          </button>

          {/* Divisor y selector de fecha */}
          <div className="border-t border-zinc-100 dark:border-zinc-900 my-1 pt-1.5 px-1.5 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Otra fecha
            </span>
            <input
              type="date"
              value={value || ""}
              onChange={(e) => {
                if (e.target.value) {
                  onChange(e.target.value);
                  setOpen(false);
                }
              }}
              className="w-full h-7 px-2 text-xs font-mono rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface CutsFiltersProps {
  sucursales: Sucursal[];
  currentSucursal?: string;
  currentDate?: string;
}

export default function CutsFilters({
  sucursales,
  currentSucursal,
  currentDate,
}: CutsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Si solo hay 1 sucursal, se selecciona automáticamente por defecto
  const effectiveSucursal = currentSucursal || (sucursales.length === 1 ? sucursales[0].id : "");

  const handleBranchChange = (branchId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (branchId) {
        params.set("sucursal", branchId);
      } else {
        params.delete("sucursal");
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleDateChange = (dateVal: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (dateVal) {
        params.set("date", dateVal);
      } else {
        params.delete("date");
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleClear = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const todayStr = getSafeDateString(new Date());
  const isTodayActive = currentDate === todayStr;

  const hasActiveFilters = Boolean(
    (sucursales.length > 1 && currentSucursal) ||
    (currentDate && !isTodayActive)
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 1. Select de Sucursal */}
      <div className="w-44 sm:w-48">
        <CustomSelect
          value={effectiveSucursal}
          onChange={handleBranchChange}
          placeholder="Todas las sucursales"
          options={sucursales.map((s) => ({ value: s.id, label: s.nombre }))}
          className="w-full"
        />
      </div>

      {/* 2. Select de Fecha (Misma línea que sucursal) */}
      <div className="w-36 sm:w-40">
        <DateSelect
          value={currentDate || todayStr}
          onChange={handleDateChange}
          className="w-full"
        />
      </div>

      {/* 3. Botón Limpiar */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClear}
          title="Restablecer filtros"
          className="h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 text-xs transition-colors cursor-pointer shrink-0"
        >
          <X size={12} />
          <span className="hidden sm:inline font-mono">Limpiar</span>
        </button>
      )}

      {/* 4. Spinner de Transición / Carga */}
      {isPending && (
        <div className="flex items-center pl-0.5">
          <Loader2 size={13} className="animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  );
}
