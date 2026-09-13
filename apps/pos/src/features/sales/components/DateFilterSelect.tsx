import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

interface DateFilterSelectProps {
  activeOffset: number;
  onChange: (offset: number) => void;
}

export function DateFilterSelect({ activeOffset, onChange }: DateFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  // Opciones restringidas a un máximo de 3 días atrás (4 opciones en total)
  const options = [
    {
      offset: 0,
      title: "Hoy",
      shortLabel: "Hoy",
      dateFormatted: format(today, "d 'de' MMM", { locale: es }),
    },
    {
      offset: 1,
      title: "Ayer",
      shortLabel: "Ayer",
      dateFormatted: format(subDays(today, 1), "d 'de' MMM", { locale: es }),
    },
    {
      offset: 2,
      title: "Hace 2 días",
      shortLabel: "Hace 2 d",
      dateFormatted: format(subDays(today, 2), "d 'de' MMM", { locale: es }),
    },
    {
      offset: 3,
      title: "Hace 3 días",
      shortLabel: "Hace 3 d",
      dateFormatted: format(subDays(today, 3), "d 'de' MMM", { locale: es }),
    },
  ];

  const activeOption = options.find((opt) => opt.offset === activeOffset) || options[0];

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (offset: number) => {
    onChange(offset);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left shrink-0">
      {/* Botón Disparador Compacto */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="h-9 px-3 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl text-xs font-semibold text-zinc-900 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-black/10"
      >
        <Calendar className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
        <span className="hidden sm:inline truncate">
          {activeOption.title} · {activeOption.dateFormatted}
        </span>
        <span className="sm:hidden truncate">{activeOption.shortLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante con UI Estilizada */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-48 sm:w-52 bg-white border border-zinc-200 rounded-2xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
        >
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = activeOffset === option.offset;
              return (
                <button
                  key={option.offset}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.offset)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left ${
                    isSelected
                      ? "bg-black text-white font-semibold shadow-sm"
                      : "text-zinc-700 hover:bg-zinc-100 font-medium active:bg-zinc-200"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs">{option.title}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? "text-zinc-300" : "text-zinc-400"
                      }`}
                    >
                      {option.dateFormatted}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-white flex-shrink-0 ml-2" />
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
