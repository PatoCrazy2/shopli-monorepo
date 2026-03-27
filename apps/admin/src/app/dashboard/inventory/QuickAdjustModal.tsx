"use client";

import { useState, useTransition } from "react";
import { adjustStock } from "./actions";

interface QuickAdjustModalProps {
  productId: string;
  productName: string;
  branches: { id: string; nombre: string }[];
  selectedBranchId?: string;
  productShares: { sucursal_id: string; cantidad: number }[];
}

export function QuickAdjustModal({ productId, productName, branches, selectedBranchId, productShares }: QuickAdjustModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStockStr, setNewStockStr] = useState<string>("");
  const [branchId, setBranchId] = useState(selectedBranchId || "");
  const [isPending, startTransition] = useTransition();

  // Find current stock for the selected branch
  const currentBranchStock = productShares.find(s => s.sucursal_id === branchId)?.cantidad ?? 0;

  const handleSave = () => {
    const newStockValue = parseInt(newStockStr);
    if (isNaN(newStockValue) || !branchId) {
      alert("Por favor ingrese una cantidad válida y seleccione una sucursal.");
      return;
    }

    const diff = newStockValue - currentBranchStock;
    if (diff === 0) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const res = await adjustStock(productId, diff, "Ajuste manual de inventario", branchId);
      if (res.error) {
        alert(res.error);
      } else {
        setIsOpen(false);
        setNewStockStr("");
        if (!selectedBranchId) setBranchId("");
      }
    });
  };

  const selectedBranchName = branches.find(b => b.id === branchId)?.nombre;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-zinc-900 text-white rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm active:scale-95"
      >
        Ajustar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-100 flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/30">
              <h2 className="text-xl font-bold text-black tracking-tight">Ajuste de Stock</h2>
              <p className="text-[12px] text-zinc-400 font-medium mt-0.5">Indica la cantidad real en estante</p>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Context Info */}
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sucursal</span>
                  {selectedBranchId ? (
                    <span className="text-sm font-semibold text-black mt-0.5">{selectedBranchName}</span>
                  ) : (
                    <select 
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="mt-1 w-full bg-zinc-50 border-none rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-black transition-all"
                    >
                      <option value="">Seleccionar Sucursal...</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Producto</span>
                  <span className="text-sm font-semibold text-black mt-0.5 truncate">{productName}</span>
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Actual</span>
                  <span className="text-2xl font-black text-zinc-400">{currentBranchStock}</span>
                </div>
                
                <div className="bg-white p-4 rounded-xl border-2 border-black ring-4 ring-black/5">
                  <span className="text-[10px] font-bold text-black uppercase tracking-widest block mb-1">Nuevo</span>
                  <input 
                    type="number" 
                    value={newStockStr} 
                    onChange={(e) => setNewStockStr(e.target.value)}
                    placeholder="0"
                    autoFocus
                    className="w-full bg-transparent text-2xl font-black text-black focus:outline-none p-0"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-5 bg-zinc-50/50 border-t border-zinc-100 flex flex-col gap-3">
              <button 
                onClick={handleSave}
                disabled={isPending || newStockStr === "" || !branchId}
                className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2"
              >
                {isPending ? "Sincronizando..." : "Confirmar Cambios"}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-zinc-400 text-[11px] font-bold uppercase tracking-wider hover:text-black transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
