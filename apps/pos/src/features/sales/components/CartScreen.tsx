import { ArrowLeft } from 'lucide-react';
import type { CartItem } from '../types/cart.types';

interface CartScreenProps {
    cartItems: CartItem[];
    totalItems: number;
    totalCart: number;
    onBack: () => void;
    onCheckout: () => void;
}

export default function CartScreen({ cartItems, totalItems, totalCart, onBack, onCheckout }: CartScreenProps) {
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
                    <div key={item.id} className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-lg">{item.name}</p>
                            <p className="text-gray-500">{item.quantity} x ${item.price}.00</p>
                        </div>
                        <p className="font-semibold text-lg">${item.price * item.quantity}.00</p>
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
