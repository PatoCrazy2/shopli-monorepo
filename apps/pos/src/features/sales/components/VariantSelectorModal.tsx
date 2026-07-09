import { X, Layers, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';

interface VariantProduct {
    id: string;
    nombre: string;
    variante_nombre: string | null;
    stock: number;
    precio_publico: number;
}

interface VariantSelectorModalProps {
    parentId: string;
    parentName: string;
    variants: VariantProduct[];
    onClose: () => void;
    onSelect: (id: string) => void;
}

export default function VariantSelectorModal({
    parentId,
    parentName,
    variants,
    onClose,
    onSelect
}: VariantSelectorModalProps) {
    // Consultar reactivamente los productos en el carrito
    const cartItems = useLiveQuery(() => db.cart.toArray()) ?? [];

    // Contar cuántas unidades de variantes de este padre hay en el carrito
    const selectedCount = cartItems
        .filter(item => item.parent_id === parentId)
        .reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-gray-500" />
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{parentName}</h3>
                            <p className="text-xs text-gray-500 font-medium">Selecciona una variante</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
                    {variants.map((v) => {
                        const isOutOfStock = v.stock <= 0;
                        return (
                            <button
                                key={v.id}
                                onClick={() => {
                                    onSelect(v.id);
                                }}
                                className={`w-full p-4 flex items-center justify-between border rounded-2xl transition-all text-left active:scale-[0.99]
                                    ${isOutOfStock 
                                        ? 'bg-red-50/10 border-red-100 hover:bg-red-50/20' 
                                        : 'bg-white border-gray-200 hover:border-black hover:bg-gray-50'
                                    }`}
                            >
                                <div className="space-y-1">
                                    <span className="font-bold text-base text-gray-900">
                                        {v.variante_nombre || "General"}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {isOutOfStock && (
                                            <span className="text-[10px] bg-red-100 text-red-700 flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-full">
                                                <AlertTriangle className="w-3 h-3" /> Sin stock
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="font-extrabold text-lg text-gray-950">
                                    ${v.precio_publico.toFixed(2)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Footer con botón de Listo */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-black text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Listo {selectedCount > 0 ? `(${selectedCount})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}
