"use client";

import { useState, useTransition, useMemo } from "react";
import { transferStock } from "./actions";

interface TransferModalProps {
  products: { id: string; nombre: string }[];
  branches: { id: string; nombre: string }[];
}

export function TransferModal({ products, branches }: TransferModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"TRANSFER" | "INGRESS">("INGRESS");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [reason, setReason] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    if (!searchProduct) return products.slice(0, 50);
    return products.filter(p => p.nombre.toLowerCase().includes(searchProduct.toLowerCase())).slice(0, 50);
  }, [products, searchProduct]);

  const handleSave = () => {
    const numericAmount = Number(amount);
    if (!productId || !numericAmount || numericAmount <= 0 || !toBranchId || !reason) return;
    if (type === "TRANSFER" && !fromBranchId) return;
    if (type === "TRANSFER" && fromBranchId === toBranchId) {
      alert("La sucursal de origen y destino no pueden ser la misma.");
      return;
    }

    startTransition(async () => {
      const res = await transferStock({
        type,
        productId,
        amount: numericAmount,
        fromBranchId: type === "TRANSFER" ? fromBranchId : undefined,
        toBranchId,
        reason
      });
      if (res.error) {
        alert(res.error);
      } else {
        setIsOpen(false);
        setProductId("");
        setAmount("");
        setFromBranchId("");
        setToBranchId("");
        setReason("");
        setSearchProduct("");
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
        Movimiento de Stock
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Nuevo Movimiento de Stock</h2>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex gap-2 p-1 bg-zinc-100 rounded-lg">
                <button 
                  onClick={() => setType("INGRESS")}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${type === "INGRESS" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  Ingreso Externo
                </button>
                <button 
                  onClick={() => setType("TRANSFER")}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${type === "TRANSFER" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  Transferencia
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Producto</label>
                <input 
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none mb-1"
                />
                <select 
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Seleccione un producto</option>
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {type === "TRANSFER" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700">Sucursal de Origen</label>
                  <select 
                    value={fromBranchId}
                    onChange={(e) => setFromBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="">Seleccione sucursal de origen</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Sucursal de Destino</label>
                <select 
                  value={toBranchId}
                  onChange={(e) => setToBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="">Seleccione sucursal destino</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Cantidad</label>
                <input 
                  type="number" 
                  min="1"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ej. 10"
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Motivo</label>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Ingreso de proveedor, Reabastecimiento..."
                  className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
                disabled={isPending || !productId || !amount || !toBranchId || !reason || (type === "TRANSFER" && !fromBranchId)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? "Procesando..." : "Confirmar Movimiento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
