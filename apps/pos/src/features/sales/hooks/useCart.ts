import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalCartItem, roundCustom } from "../../../lib/db";

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
                precio_mayoreo: product.precio_mayoreo ?? null,
                min_cantidad_mayoreo: product.min_cantidad_mayoreo ?? null,
                quantity: 1,
                descuento_manual: 0,
                nota_descuento: "",
                parent_id: product.parent_id ?? null,
                variante_nombre: product.variante_nombre ?? null
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

    const applyManualDiscount = async (id: string, discount: number, note: string) => {
        await db.cart.update(id, {
            descuento_manual: discount,
            nota_descuento: note
        });
    };

    // Agrupación para mayoreo cruzado por variante
    const groupQuantities = new Map<string, number>();
    cartItems.forEach(item => {
        const key = item.parent_id || item.producto_id;
        groupQuantities.set(key, (groupQuantities.get(key) || 0) + item.quantity);
    });

    const totalCart = cartItems.reduce((acc: number, item: LocalCartItem) => {
        const key = item.parent_id || item.producto_id;
        const groupQty = groupQuantities.get(key) || 0;

        const hasMayoreo = item.min_cantidad_mayoreo !== null && 
                           item.precio_mayoreo !== null && 
                           groupQty >= item.min_cantidad_mayoreo;
        const basePrice = hasMayoreo ? (item.precio_mayoreo as number) : item.price;
        const subtotal = roundCustom(basePrice * item.quantity);
        return acc + subtotal - (item.descuento_manual || 0);
    }, 0);

    const totalItems = cartItems.reduce((acc: number, item: LocalCartItem) => acc + item.quantity, 0);

    return {
        cartItems,
        showCart,
        setShowCart,
        handleAddToCart,
        removeFromCart,
        updateQuantity,
        applyManualDiscount,
        clearCart,
        totalCart,
        totalItems
    };
}
