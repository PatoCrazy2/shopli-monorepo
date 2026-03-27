"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function BranchFilter({ branches }: { branches: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentBranch = searchParams.get("branch") || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      router.push(`/dashboard/inventory?branch=${e.target.value}`);
    } else {
      router.push(`/dashboard/inventory`);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <div className="relative flex-1 sm:min-w-[280px]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <select
          value={currentBranch}
          onChange={handleChange}
          className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 hover:border-zinc-300 transition-all cursor-pointer shadow-sm appearance-none"
        >
          <option value="">🌎 Todas las Sucursales (Consolidado)</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>📍 {b.nombre}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  );
}
