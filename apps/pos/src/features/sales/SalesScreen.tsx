import { useState } from "react";
import SaleSuccessModal from "./components/SaleSuccessModal";
import { ArrowLeft } from "lucide-react";

interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

export default function SalesScreen() {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);

    // Mock checkout handler
    const handleCheckout = () => {
        // In a real scenario, an offline sale is generated here
        setShowSuccessModal(true);
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        setCartItems([]);
        setShowCart(false);
    };

    const handleAddToCart = (id: number) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === id);
            if (existing) {
                return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { id, name: `Producto ${id}`, price: 100 * id, quantity: 1 }];
        });
    };

    const totalCart = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="relative flex w-full h-full bg-gray-50 overflow-hidden">
            {/* Product Search & Grid */}
            {!showCart && (
                <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
                    <div className="mb-6 shrink-0">
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="w-full h-14 px-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400 bg-white"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-24">
                        {/* Mock Product Cards */}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                            <button
                                key={i}
                                onClick={() => handleAddToCart(i)}
                                className="h-32 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center p-4 hover:bg-gray-100 active:bg-gray-200"
                            >
                                <span className="font-semibold text-lg">Producto {i}</span>
                                <span className="text-gray-500">$ {100 * i}.00</span>
                            </button>
                        ))}
                    </div>

                    {/* Ir a pagar Button Sticky */}
                    {cartItems.length > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 to-transparent">
                            <div className="flex justify-center">
                                <button
                                    onClick={() => setShowCart(true)}
                                    className="w-full max-w-lg h-16 bg-black text-white text-xl font-bold rounded-lg hover:bg-zinc-800 active:bg-zinc-900 flex items-center justify-between px-6 shadow-2xl"
                                >
                                    <span className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-md text-sm">
                                        {totalItems}
                                    </span>
                                    <span>Ir a pagar</span>
                                    <span>${totalCart}.00</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Shopping Cart Screen */}
            {showCart && (
                <div className="flex-1 flex flex-col bg-white">
                    <div className="h-16 flex items-center px-6 border-b border-gray-200 gap-4 shrink-0">
                        <button
                            onClick={() => setShowCart(false)}
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
                            onClick={handleCheckout}
                            className="w-full h-16 bg-black text-white text-xl font-bold rounded-lg hover:bg-zinc-800 active:bg-zinc-900 flex items-center justify-center"
                        >
                            Cobrar
                        </button>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <SaleSuccessModal onConfirm={closeSuccessModal} />
            )}
        </div>
    );
}
