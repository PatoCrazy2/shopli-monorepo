"use client";

import { Filter } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SucursalFilter({ 
  sucursales, 
  currentValue 
}: { 
  sucursales: { id: string, nombre: string }[], 
  currentValue?: string 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (val) {
      params.set('sucursalId', val);
    } else {
      params.delete('sucursalId');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <select 
        value={currentValue || ""}
        onChange={handleChange}
        className="pl-10 pr-10 h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all appearance-none min-w-[200px] cursor-pointer"
      >
        <option value="">Todas las Sucursales</option>
        {sucursales.map(s => (
          <option key={s.id} value={s.id}>{s.nombre}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
}
