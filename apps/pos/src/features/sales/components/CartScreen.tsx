import { ArrowLeft, Trash2, Plus, Minus, AlertTriangle } from 'lucide-react';
import type { CartItem } from '../types/cart.types';
import { useAuth } from '../../../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';

interface CartScreenProps {
    cartItems: CartItem[];
    totalItems: number;
    totalCart: number;
    onBack: () => void;
    onCheckout: () => void;
    onRemove: (id: string) => void;
    onUpdateQuantity: (id: string, quantity: number) => void;
}

export default function CartScreen({ cartItems, totalItems, totalCart, onBack, onCheckout, onRemove, onUpdateQuantity }: CartScreenProps) {
    const { user } = useAuth();
    
    // Consultamos el inventario local para los artículos en el carrito
    const inventoryDb = useLiveQuery(() => {
        if (!user) return [];
        return db.inventory.where('sucursal_id').equals(user.branchId).toArray();
    }, [user]) ?? [];

    return (
        <div className="flex-1 flex flex-col bg-white">
            <div className="h-16 flex items-center px-6 border-b border-gray-200 gap-4 shrink-0">
                <button
                    onClick={onBack}
                    className="w-12 h-12 flex items-center justify-center -ml-3 hover:bg-gray-100 active:bg-gray-200 rounded-lg"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold tracking-tight">Carrito ({totalItems})</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.map(item => {
                    const inv = inventoryDb.find(i => i.producto_id === item.producto_id);
                    const currentStock = inv ? inv.cantidad : 0;
                    const stockIsLow = currentStock <= 0;
                    
                    return (
                    <div key={item.id} className={`flex items-center justify-between p-4 border shadow-sm rounded-xl transition-colors ${stockIsLow ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-gray-100'}`}>
                        <div className="flex-1 pr-2">
                            <div className="flex items-start gap-2">
                                <p className="font-semibold text-lg leading-tight">{item.name}</p>
                                {stockIsLow && (
                                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                        <AlertTriangle className="w-3 h-3" />
                                        Stock: {currentStock}
                                    </span>
                                )}
                            </div>
                            <p className="font-bold text-gray-900 mt-1">${item.price * item.quantity}.00</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                                <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                    className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-l-lg transition-colors"
                                >
                                    <Minus className="w-5 h-5 text-gray-700" />
                                </button>
                                <span className="w-10 text-center font-semibold">{item.quantity}</span>
                                <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                    className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-r-lg transition-colors"
                                >
                                    <Plus className="w-5 h-5 text-gray-700" />
                                </button>
                            </div>
                            <button
                                onClick={() => onRemove(item.id)}
                                className="p-3 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )})}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-medium text-gray-500">Total</span>
                    <span className="text-4xl font-bold">${totalCart}.00</span>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={cartItems.length === 0}
                    className={`w-full h-16 text-xl font-bold rounded-lg flex items-center justify-center transition-colors ${cartItems.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-zinc-800 active:bg-zinc-900'
                        }`}
                >
                    Cobrar
                </button>
            </div>
        </div>
    );
}
