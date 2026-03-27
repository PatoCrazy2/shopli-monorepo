"use client";

import { useState, useTransition } from "react";
import { adjustStock } from "./actions";

interface QuickAdjustModalProps {
  productId: string;
  productName: string;
  branches: { id: string; nombre: string }[];
  selectedBranchId?: string;
}

export function QuickAdjustModal({ productId, productName, branches, selectedBranchId }: QuickAdjustModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [branchId, setBranchId] = useState(selectedBranchId || "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount === 0 || !branchId) {
      alert("Compruebe los campos requeridos (sucursal, cantidad)");
      return;
    }
    if (!reason.trim()) {
      alert("Por favor ingrese un motivo para el ajuste.");
      return;
    }

    startTransition(async () => {
      const res = await adjustStock(productId, numericAmount, reason, branchId);
      if (res.error) {
        alert(res.error);
      } else {
        setIsOpen(false);
        setAmount("");
        setReason("");
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-200">
            <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <h2 className="text-base font-bold text-zinc-900 leading-tight">Ajuste Rápido</h2>
                <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[250px]">{productName}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {!selectedBranchId ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Sucursal a afectar</label>
                  <select 
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 appearance-none"
                  >
                    <option value="">Seleccione sucursal...</option>
                    {branches.map(b => (
                       <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Sucursal: {selectedBranchName}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Cantidad (+/-)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Ej. 5"
                    autoFocus
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Motivo</label>
                  <input 
                    type="text" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Conteo"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-4 bg-zinc-50 border-t border-zinc-100 flex flex-col gap-2">
              <button 
                onClick={handleSave}
                disabled={isPending || !amount || !reason || !branchId}
                className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-shadow shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? "Procesando..." : "Confirmar Ajuste"}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="w-full py-2 text-zinc-500 text-[11px] font-bold uppercase tracking-wider hover:text-zinc-700 transition-colors"
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
