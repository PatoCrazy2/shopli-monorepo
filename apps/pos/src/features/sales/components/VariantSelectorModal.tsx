import { X, Layers, AlertTriangle } from 'lucide-react';

interface VariantProduct {
    id: string;
    nombre: string;
    variante_nombre: string | null;
    stock: number;
    precio_publico: number;
}

interface VariantSelectorModalProps {
    parentName: string;
    variants: VariantProduct[];
    onClose: () => void;
    onSelect: (id: string) => void;
}

export default function VariantSelectorModal({
    parentName,
    variants,
    onClose,
    onSelect
}: VariantSelectorModalProps) {
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
                                    onClose();
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
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                            Stock: {v.stock}
                                        </span>
                                        {isOutOfStock && (
                                            <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-bold">
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
            </div>
        </div>
    );
}
