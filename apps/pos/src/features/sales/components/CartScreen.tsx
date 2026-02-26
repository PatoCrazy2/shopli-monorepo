import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../types/cart.types';

interface CartScreenProps {
    cartItems: CartItem[];
    totalItems: number;
    totalCart: number;
    onBack: () => void;
    onCheckout: () => void;
    onRemove: (id: number) => void;
    onUpdateQuantity: (id: number, quantity: number) => void;
}

export default function CartScreen({ cartItems, totalItems, totalCart, onBack, onCheckout, onRemove, onUpdateQuantity }: CartScreenProps) {
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
                {cartItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-100 shadow-sm rounded-xl">
                        <div className="flex-1">
                            <p className="font-semibold text-lg">{item.name}</p>
                            <p className="font-bold text-gray-900">${item.price * item.quantity}.00</p>
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
                ))}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-medium text-gray-500">Total</span>
                    <span className="text-4xl font-bold">${totalCart}.00</span>
                </div>

                <button
                    onClick={onCheckout}
                    className="w-full h-16 bg-black text-white text-xl font-bold rounded-lg hover:bg-zinc-800 active:bg-zinc-900 flex items-center justify-center"
                >
                    Cobrar
                </button>
            </div>
        </div>
    );
}
