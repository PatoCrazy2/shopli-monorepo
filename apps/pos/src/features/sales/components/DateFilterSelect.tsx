import { Calendar, ChevronDown } from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

interface DateFilterSelectProps {
  activeOffset: number;
  onChange: (offset: number) => void;
}

export function DateFilterSelect({ activeOffset, onChange }: DateFilterSelectProps) {
  const today = new Date();

  const options = [
    {
      offset: 0,
      label: `Hoy (${format(today, "d 'de' MMM", { locale: es })})`,
    },
    {
      offset: 1,
      label: `Ayer (${format(subDays(today, 1), "d 'de' MMM", { locale: es })})`,
    },
    {
      offset: 2,
      label: `Hace 2 días (${format(subDays(today, 2), "d 'de' MMM", { locale: es })})`,
    },
    {
      offset: 3,
      label: `Hace 3 días (${format(subDays(today, 3), "d 'de' MMM", { locale: es })})`,
    },
    {
      offset: 4,
      label: `Hace 4 días (${format(subDays(today, 4), "d 'de' MMM", { locale: es })})`,
    },
    {
      offset: 5,
      label: `Hace 5 días (${format(subDays(today, 5), "d 'de' MMM", { locale: es })})`,
    },
    {
      offset: 6,
      label: `Hace 6 días (${format(subDays(today, 6), "d 'de' MMM", { locale: es })})`,
    },
  ];

  return (
    <div className="relative inline-flex items-center">
      <Calendar className="absolute left-3 w-4 h-4 text-zinc-500 pointer-events-none" />
      <select
        value={activeOffset}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Filtrar ventas por fecha"
        className="appearance-none pl-9 pr-8 py-2 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl text-xs sm:text-sm font-semibold text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.offset} value={opt.offset}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
    </div>
  );
}
