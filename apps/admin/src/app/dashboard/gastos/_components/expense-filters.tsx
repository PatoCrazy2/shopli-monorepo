"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Check, X, Calendar as CalendarIcon, Loader2, Globe, MapPin, Tag, Store } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface Sucursal {
  id: string;
  nombre: string;
}

interface CustomSelectOption {
  value: string;
  label: string;
}

function getSafeDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  icon,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder: string;
  icon?: React.ReactNode;
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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
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
          "h-10 px-3 w-full rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all outline-none cursor-pointer shadow-2xs",
          open
            ? "border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10"
            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        )}
      >
        <span className="truncate flex items-center gap-2">
          {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown size={12} className={cn("text-zinc-400 transition-transform duration-200 shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 min-w-[200px] max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 text-xs animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer",
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
                "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer",
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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const isToday = value === todayStr;
  const isYesterday = value === yesterdayStr;
  const isAll = !value;
  const isCustom = Boolean(value && !isToday && !isYesterday);

  let displayLabel = "Todas las fechas";
  if (isToday) displayLabel = "Hoy";
  else if (isYesterday) displayLabel = "Ayer";
  else if (isCustom) displayLabel = value;

  return (
    <div ref={containerRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-10 px-3 w-full rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all outline-none cursor-pointer shadow-2xs",
          open
            ? "border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10"
            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
        )}
      >
        <span className="truncate flex items-center gap-2">
          <CalendarIcon size={12} className="text-zinc-400 shrink-0" />
          <span className={cn("truncate", isCustom && "font-mono")}>{displayLabel}</span>
        </span>
        <ChevronDown size={12} className={cn("text-zinc-400 transition-transform duration-200 shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 min-w-[190px] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 text-xs animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer",
              isAll
                ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
            )}
          >
            <span>Todas las fechas</span>
            {isAll && <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onChange(todayStr);
              setOpen(false);
            }}
            className={cn(
              "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer",
              isToday
                ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
            )}
          >
            <span>Hoy</span>
            {isToday && <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onChange(yesterdayStr);
              setOpen(false);
            }}
            className={cn(
              "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer",
              isYesterday
                ? "bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
            )}
          >
            <span>Ayer</span>
            {isYesterday && <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0" />}
          </button>

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
              className="w-full h-8 px-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const CATEGORIAS_OPCIONES: CustomSelectOption[] = [
  { value: "NOMINA", label: "Nómina" },
  { value: "RENTA", label: "Renta & Local" },
  { value: "MERCANCIA", label: "Mercancía" },
  { value: "CAJA_CHICA", label: "Caja Chica" },
  { value: "VARIABLE", label: "Variables" },
];

export function ExpenseFilters({
  sucursales,
  currentSucursal,
  currentDate,
  currentCategoria,
}: {
  sucursales: Sucursal[];
  currentSucursal?: string;
  currentDate?: string;
  currentCategoria?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key: string, val: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleClear = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(currentSucursal || currentDate || currentCategoria);

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
      {/* 1. Sucursal */}
      <div className="flex-1 sm:w-48 sm:flex-initial min-w-0">
        <CustomSelect
          value={currentSucursal || ""}
          onChange={(val) => handleFilterChange("sucursalId", val)}
          placeholder="Todas las sucursales"
          icon={<Store size={12} />}
          options={sucursales.map((s) => ({ value: s.id, label: s.nombre }))}
          className="w-full"
        />
      </div>

      {/* 2. Categoría */}
      <div className="flex-1 sm:w-40 sm:flex-initial min-w-0">
        <CustomSelect
          value={currentCategoria || ""}
          onChange={(val) => handleFilterChange("categoria", val)}
          placeholder="Categoría"
          icon={<Tag size={12} />}
          options={CATEGORIAS_OPCIONES}
          className="w-full"
        />
      </div>

      {/* 3. Fecha */}
      <div className="flex-1 sm:w-40 sm:flex-initial min-w-0">
        <DateSelect
          value={currentDate || ""}
          onChange={(val) => handleFilterChange("startDate", val)}
          className="w-full"
        />
      </div>

      {/* 4. Limpiar */}
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

      {/* 5. Spinner */}
      {isPending && (
        <div className="flex items-center pl-0.5 shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  );
}
