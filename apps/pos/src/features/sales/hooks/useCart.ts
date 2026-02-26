import { useState } from "react";
import type { CartItem } from "../types/cart.types";

export function useCart() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);

    const handleAddToCart = (id: number) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.id === id);
            if (existing) {
                return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { id, name: `Producto ${id}`, price: 100 * id, quantity: 1 }];
        });
    };

    const clearCart = () => {
        setCartItems([]);
        setShowCart(false);
    };

    const totalCart = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return {
        cartItems,
        showCart,
        setShowCart,
        handleAddToCart,
        clearCart,
        totalCart,
        totalItems
    };
}
