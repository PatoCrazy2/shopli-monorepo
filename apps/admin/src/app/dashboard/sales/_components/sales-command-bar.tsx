"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Check, X, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface BranchOption {
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
  className
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

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={containerRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-9 px-3 w-full rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-all outline-none",
          open
            ? "border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10"
            : "border-zinc-200 bg-zinc-50 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={13} className={cn("text-zinc-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[180px] max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 text-xs animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between text-xs",
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
                "w-full px-2.5 py-1.5 text-left rounded-lg transition-colors flex items-center justify-between text-xs",
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

export function SalesCommandBar({
  sucursales,
  currentSucursalId,
  currentDate,
}: {
  sucursales: BranchOption[];
  currentSucursalId?: string;
  currentDate?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleBranchChange = (branchId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (branchId) {
        params.set("SUCURSAL", branchId);
      } else {
        params.delete("SUCURSAL");
      }
      params.delete("page");
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
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePreset = (preset: "today" | "yesterday") => {
    const now = new Date();
    if (preset === "yesterday") {
      now.setDate(now.getDate() - 1);
    }
    const dateFormatted = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
    }).format(now);

    handleDateChange(dateFormatted);
  };

  const handleClear = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(new Date());

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(yesterdayDate);

  const isTodayActive = currentDate === todayStr;
  const isYesterdayActive = currentDate === yesterdayStr;

  return (
    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
      {/* Selector de Sucursal */}
      <div className="w-full sm:w-48">
        <CustomSelect
          value={currentSucursalId || ""}
          onChange={handleBranchChange}
          placeholder="Seleccionar sucursal..."
          options={sucursales.map((s) => ({ value: s.id, label: s.nombre }))}
          className="w-full"
        />
      </div>

      {/* Presets Rápidos de Fecha */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => handlePreset("today")}
          className={cn(
            "h-8 px-2.5 rounded-lg text-xs font-medium transition-all",
            isTodayActive
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          )}
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => handlePreset("yesterday")}
          className={cn(
            "h-8 px-2.5 rounded-lg text-xs font-medium transition-all",
            isYesterdayActive
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          )}
        >
          Ayer
        </button>
      </div>

      {/* Input de Fecha Calendario */}
      <div className="relative flex items-center">
        <input
          type="date"
          value={currentDate || ""}
          onChange={(e) => handleDateChange(e.target.value)}
          className="h-9 px-2.5 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
        />
      </div>

      {/* Botón Limpiar */}
      {(currentSucursalId || currentDate) && (
        <button
          type="button"
          onClick={handleClear}
          title="Limpiar filtros"
          className="h-9 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 text-xs transition-colors"
        >
          <X size={13} />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      )}

      {/* Spinner de Transición / Carga */}
      {isPending && (
        <div className="flex items-center pl-1">
          <Loader2 size={14} className="animate-spin text-zinc-400" />
        </div>
      )}
    </div>
  );
}
