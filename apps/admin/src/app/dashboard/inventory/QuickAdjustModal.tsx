"use client";

import { useState, useTransition } from "react";
import { adjustStock } from "./actions";

interface QuickAdjustModalProps {
  productId: string;
  productName: string;
}

export function QuickAdjustModal({ productId, productName }: QuickAdjustModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount === 0) return;
    if (!reason.trim()) {
      alert("Por favor ingrese un motivo para el ajuste.");
      return;
    }

    startTransition(async () => {
      const res = await adjustStock(productId, numericAmount, reason);
      if (res.error) {
        alert(res.error);
      } else {
        setIsOpen(false);
        setAmount("");
        setReason("");
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-zinc-900 text-white rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-sm active:scale-95"
      >
        Ajustar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Ajuste de Inventario</h2>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Producto</p>
                <div className="font-semibold text-zinc-900 bg-white p-3 rounded-lg border border-zinc-200 shadow-sm">
                  {productName}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Cantidad a sumar o restar</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ej. 10 para agregar, -5 para restar"
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-shadow"
                />
                <p className="text-[11px] text-zinc-500 font-medium">Usa números negativos (-) para descontar del inventario.</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-sm font-semibold text-zinc-700">Motivo del ajuste</label>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Llegó mercancía, Conteo físico final..."
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-shadow"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-bold hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isPending || !amount || !reason}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Procesando...
                  </>
                ) : "Guardar Ajuste"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
