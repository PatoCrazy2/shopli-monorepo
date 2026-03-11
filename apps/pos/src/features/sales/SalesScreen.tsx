import { useState } from "react";
import SaleSuccessModal from "./components/SaleSuccessModal";
import ProductGrid from "./components/ProductGrid";
import CheckoutBar from "./components/CheckoutBar";
import CartScreen from "./components/CartScreen";
import { useCart } from "./hooks/useCart";
import { useSalesHistory } from "./hooks/useSalesHistory";

export default function SalesScreen() {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
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
        </div>
    );
}
