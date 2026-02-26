import { useState } from "react";
import SaleSuccessModal from "./components/SaleSuccessModal";
import ProductGrid from "./components/ProductGrid";
import CheckoutBar from "./components/CheckoutBar";
import CartScreen from "./components/CartScreen";
import { useCart } from "./hooks/useCart";

export default function SalesScreen() {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const {
        cartItems,
        showCart,
        setShowCart,
        handleAddToCart,
        clearCart,
        totalCart,
        totalItems
    } = useCart();

    const handleCheckout = () => {
        // In a real scenario, an offline sale is generated here
        setShowSuccessModal(true);
    };

    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        clearCart();
    };

    return (
        <div className="relative flex w-full h-full bg-gray-50 overflow-hidden">
            {/* Product Search & Grid */}
            {!showCart && (
                <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
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
                />
            )}

            {showSuccessModal && (
                <SaleSuccessModal onConfirm={closeSuccessModal} />
            )}
        </div>
    );
}
