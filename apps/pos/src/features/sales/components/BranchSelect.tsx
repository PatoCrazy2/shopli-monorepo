import { useState, useRef, useEffect } from 'react';
import { Landmark, ChevronDown, Check, Loader2 } from 'lucide-react';
import type { LocalBranch } from '../../../lib/db';

interface BranchSelectProps {
  branches: LocalBranch[];
  selectedBranchId: string;
  onChange: (branchId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function BranchSelect({
  branches,
  selectedBranchId,
  onChange,
  disabled = false,
  isLoading = false,
}: BranchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  // Cerrar el menú al hacer clic o toque fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (branchId: string) => {
    onChange(branchId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {/* Botón Disparador */}
      <button
        type="button"
        disabled={disabled || isLoading || branches.length === 0}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-13 px-4 bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl flex items-center justify-between shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'border-zinc-400 ring-2 ring-black/5' : ''
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
            ) : (
              <Landmark className="w-4 h-4" />
            )}
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Sucursal
            </span>
            <span className="text-sm font-bold text-zinc-900 truncate">
              {isLoading
                ? 'Cargando sucursales...'
                : selectedBranch?.nombre || 'Selecciona una sucursal'}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 origin-top"
        >
          <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar">
            {branches.map((branch) => {
              const isSelected = selectedBranchId === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(branch.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-black text-white font-semibold shadow-sm'
                      : 'text-zinc-800 hover:bg-zinc-100 font-medium active:bg-zinc-200'
                  }`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-bold text-xs">{branch.nombre}</span>
                    {branch.direccion && (
                      <span
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-zinc-300' : 'text-zinc-400'
                        }`}
                      >
                        {branch.direccion}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-white shrink-0 ml-2" />
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
