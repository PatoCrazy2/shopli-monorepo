import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalCartItem } from "../../../lib/db";

export function useCart() {
    const [showCart, setShowCart] = useState(false);
    
    // Reactively query the carts table
    const cartItemsDb = useLiveQuery(() => db.cart.toArray(), []);
    const cartItems = (cartItemsDb || []) as LocalCartItem[];

    const handleAddToCart = async (product_id: string) => {
        // Fetch product details first
        const product = await db.products.get(product_id);
        if (!product) return;

        const existingItem = await db.cart.where('producto_id').equals(product_id).first();
        if (existingItem) {
            await db.cart.update(existingItem.id, {
                quantity: existingItem.quantity + 1
            });
        } else {
            await db.cart.add({
                id: crypto.randomUUID(),
                producto_id: product.id,
                name: product.nombre,
                price: product.precio_publico,
                quantity: 1
            });
        }
    };

    const clearCart = async () => {
        await db.cart.clear();
        setShowCart(false);
    };

    const removeFromCart = async (id: string) => {
        await db.cart.delete(id);
    };

    const updateQuantity = async (id: string, quantity: number) => {
        if (quantity <= 0) {
            await removeFromCart(id);
            return;
        }
        await db.cart.update(id, { quantity });
    };

    const totalCart = cartItems.reduce((acc: number, item: LocalCartItem) => acc + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((acc: number, item: LocalCartItem) => acc + item.quantity, 0);

    return {
        cartItems,
        showCart,
        setShowCart,
        handleAddToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCart,
        totalItems
    };
}
