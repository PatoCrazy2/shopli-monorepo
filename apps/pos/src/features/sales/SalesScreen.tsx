import { useState } from "react";
import SaleSuccessModal from "./components/SaleSuccessModal";
import ProductGrid from "./components/ProductGrid";
import CheckoutBar from "./components/CheckoutBar";
import CartScreen from "./components/CartScreen";
import { useCart } from "./hooks/useCart";
import { useSalesHistory } from "./hooks/useSalesHistory";
import ExpenseModal from "./components/ExpenseModal";
import { Wallet } from "lucide-react";

export default function SalesScreen() {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const {
        cartItems,
        showCart,
        setShowCart,
        handleAddToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCart,
        totalItems
    } = useCart();
    const { addSale } = useSalesHistory();

    const handleCheckout = async () => {
        // En un escenario real, aquí se persistiría en RxDB (ahora Dexie)
        const sale = await addSale(cartItems, totalCart);
        if (sale) {
            setShowSuccessModal(true);
        } else {
            alert("Error: No hay turno activo o sesión de usuario.");
        }
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        clearCart();
    };

    return (
        <div className="relative flex w-full h-full bg-gray-50 overflow-hidden">
            {/* Product Search & Grid */}
            {!showCart && (
                <div className="flex-1 flex flex-col p-3 sm:p-6 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => setShowExpenseModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-gray-700"
                        >
                            <Wallet className="w-5 h-5 text-gray-400" />
                            Gasto Caja Chica
                        </button>
                    </div>
                    <ProductGrid onAddToCart={handleAddToCart} />

                    <CheckoutBar
                        totalItems={totalItems}
                        totalCart={totalCart}
                        onGoToCart={() => setShowCart(true)}
                    />
                </div>
            )}

            {/* Shopping Cart Screen */}
            {showCart && (
                <CartScreen
                    cartItems={cartItems}
                    totalItems={totalItems}
                    totalCart={totalCart}
                    onBack={() => setShowCart(false)}
                    onCheckout={handleCheckout}
                    onRemove={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                />
            )}

            {showSuccessModal && (
                <SaleSuccessModal onConfirm={closeSuccessModal} />
            )}

            {showExpenseModal && (
                <ExpenseModal onClose={() => setShowExpenseModal(false)} />
            )}
        </div>
    );
}
