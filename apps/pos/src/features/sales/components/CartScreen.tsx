import { useState } from 'react';
import { ArrowLeft, Trash2, Plus, Minus, AlertTriangle, Tag, X } from 'lucide-react';
import type { CartItem } from '../types/cart.types';
import { useAuth } from '../../../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, roundCustom } from '../../../lib/db';

interface CartScreenProps {
    cartItems: CartItem[];
    totalItems: number;
    totalCart: number;
    onBack: () => void;
    onCheckout: () => void;
    onRemove: (id: string) => void;
    onUpdateQuantity: (id: string, quantity: number) => void;
    onApplyDiscount: (id: string, discount: number, note: string) => Promise<void>;
}

export default function CartScreen({
    cartItems,
    totalItems,
    totalCart,
    onBack,
    onCheckout,
    onRemove,
    onUpdateQuantity,
    onApplyDiscount
}: CartScreenProps) {
    const { user } = useAuth();
    
    // Estados para el modal de descuento manual
    const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | null>(null);
    const [discountAmount, setDiscountAmount] = useState<string>('');
    const [discountNote, setDiscountNote] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');

    // Consultamos el inventario local para los artículos en el carrito
    const inventoryDb = useLiveQuery(() => {
        if (!user) return [];
        return db.inventory.where('sucursal_id').equals(user.branchId).toArray();
    }, [user]) ?? [];

    // Agrupación para mayoreo cruzado por variante
    const groupQuantities = new Map<string, number>();
    cartItems.forEach(it => {
        const k = it.parent_id || it.producto_id;
        groupQuantities.set(k, (groupQuantities.get(k) || 0) + it.quantity);
    });

    const handleSaveDiscount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemForDiscount) return;

        const discountNum = Number(discountAmount) || 0;
        if (discountNum < 0) {
            setErrorMsg('El descuento no puede ser negativo.');
            return;
        }

        const key = selectedItemForDiscount.parent_id || selectedItemForDiscount.producto_id;
        const groupQty = groupQuantities.get(key) || 0;

        const hasMayoreo = selectedItemForDiscount.min_cantidad_mayoreo !== null && 
                           selectedItemForDiscount.precio_mayoreo !== null && 
                           groupQty >= selectedItemForDiscount.min_cantidad_mayoreo;
        const basePrice = hasMayoreo ? (selectedItemForDiscount.precio_mayoreo as number) : selectedItemForDiscount.price;
        const maxAllowed = roundCustom(basePrice * selectedItemForDiscount.quantity);

        if (discountNum > maxAllowed) {
            setErrorMsg(`El descuento no puede superar el subtotal del ítem ($${maxAllowed}.00).`);
            return;
        }

        if (discountNum > 0 && !discountNote.trim()) {
            setErrorMsg('La nota es obligatoria para registrar un descuento.');
            return;
        }

        await onApplyDiscount(selectedItemForDiscount.id, discountNum, discountNum > 0 ? discountNote.trim() : '');
        setSelectedItemForDiscount(null);
        setDiscountAmount('');
        setDiscountNote('');
        setErrorMsg('');
    };

    return (
        <div className="fixed inset-0 z-50 bg-zinc-50 flex flex-col font-sans select-none overflow-hidden">
            {/* Contextual Focus Header */}
            <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 bg-white border-b border-zinc-200/80 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Volver a catálogo de ventas"
                        className="w-10 h-10 rounded-full bg-white border border-zinc-200/80 hover:bg-zinc-100 active:scale-95 flex items-center justify-center text-zinc-700 shadow-2xs cursor-pointer transition-none"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                            Resumen de Venta
                        </h2>
                        <span className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-xs font-extrabold flex items-center justify-center tabular-nums">
                            {totalItems}
                        </span>
                    </div>
                </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 custom-scrollbar">
                {cartItems.map(item => {
                    const inv = inventoryDb.find(i => i.producto_id === item.producto_id);
                    const currentStock = inv ? inv.cantidad : 0;
                    const stockIsLow = currentStock <= 0;
                    
                    const key = item.parent_id || item.producto_id;
                    const groupQty = groupQuantities.get(key) || 0;

                    const hasMayoreo = item.min_cantidad_mayoreo !== null && 
                                       item.precio_mayoreo !== null && 
                                       groupQty >= item.min_cantidad_mayoreo;
                    const basePrice = hasMayoreo ? (item.precio_mayoreo as number) : item.price;
                    const itemTotal = Math.max(0, roundCustom(basePrice * item.quantity) - (item.descuento_manual || 0));

                    return (
                        <div
                            key={item.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border shadow-xs transition-none gap-3 sm:gap-4 ${
                                stockIsLow
                                    ? 'bg-amber-50/20 border-amber-200/80'
                                    : 'bg-white border-zinc-200/80'
                            }`}
                        >
                            <div className="flex-1 pr-2">
                                <div className="flex items-start gap-2">
                                    <p className="font-semibold text-base sm:text-lg leading-tight text-zinc-900">
                                        {item.name} {item.variante_nombre ? `(${item.variante_nombre})` : ''}
                                    </p>
                                    {stockIsLow && (
                                        <span className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                                            <AlertTriangle className="w-3 h-3" />
                                            Stock: {currentStock}
                                        </span>
                                    )}
                                </div>

                                {/* Precios con Mayoreo Tachado y Descuento Manual */}
                                <div className="mt-1 flex flex-col gap-0.5">
                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                                        <span className="font-extrabold text-zinc-950 text-base sm:text-lg tabular-nums tracking-tight">
                                            ${Number(itemTotal).toFixed(2)}
                                        </span>
                                        {hasMayoreo && (
                                            <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-bold">
                                                Oferta (<s>${item.price}</s> ${item.precio_mayoreo}/u)
                                            </span>
                                        )}
                                    </div>
                                    {item.descuento_manual > 0 && (
                                        <span className="text-xs text-amber-700 font-medium">
                                            Descuento: -${item.descuento_manual}.00 ({item.nota_descuento})
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3">
                                {/* Cápsula Integrada de Cantidad */}
                                <div className="inline-flex items-center bg-zinc-100 rounded-full p-1 border border-zinc-200/60 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                        aria-label="Disminuir cantidad"
                                        className="w-8 h-8 rounded-full bg-white text-zinc-800 hover:bg-zinc-50 active:scale-90 flex items-center justify-center shadow-2xs cursor-pointer transition-none"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-8 sm:w-10 text-center font-bold text-sm sm:text-base tabular-nums text-zinc-900">
                                        {item.quantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                        aria-label="Aumentar cantidad"
                                        className="w-8 h-8 rounded-full bg-white text-zinc-800 hover:bg-zinc-50 active:scale-90 flex items-center justify-center shadow-2xs cursor-pointer transition-none"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {/* Botón de Descuento Manual */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedItemForDiscount(item);
                                            setDiscountAmount(item.descuento_manual > 0 ? String(item.descuento_manual) : '');
                                            setDiscountNote(item.nota_descuento || '');
                                            setErrorMsg('');
                                        }}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-none cursor-pointer ${
                                            item.descuento_manual > 0 
                                                ? 'text-amber-800 bg-amber-100 border border-amber-200' 
                                                : 'text-zinc-500 bg-zinc-100 hover:bg-zinc-200/70 border border-zinc-200/50'
                                        }`}
                                        title="Descuento Manual"
                                    >
                                        <Tag className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onRemove(item.id)}
                                        className="w-9 h-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 flex items-center justify-center transition-none cursor-pointer border border-red-200/50"
                                        title="Eliminar producto"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Panel (Totales y Pago) */}
            <div className="bg-white border-t border-zinc-200/80 rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.04)] p-4 sm:p-6 shrink-0 flex flex-col gap-3.5">
                <div className="flex justify-between items-baseline px-1">
                    <span className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-wider">Total a pagar</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight tabular-nums">
                        ${Number(totalCart).toFixed(2)}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onCheckout}
                    disabled={cartItems.length === 0}
                    className={`w-full h-14 sm:h-15 rounded-full font-bold text-base sm:text-lg flex items-center justify-center shadow-lg transition-transform cursor-pointer select-none ${
                        cartItems.length === 0
                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                            : 'bg-black text-white hover:bg-zinc-800 active:scale-[0.99]'
                    }`}
                >
                    <span>Cobrar</span>
                </button>
            </div>

            {/* Modal para Descuento Manual */}
            {selectedItemForDiscount && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[1px]">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200/80 overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                            <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-amber-600" />
                                Descuento: {selectedItemForDiscount.name}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedItemForDiscount(null)}
                                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center cursor-pointer transition-none"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDiscount} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1.5">
                                    Dinero a descontar ($)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(e.target.value)}
                                    placeholder="Ej. 15"
                                    className="w-full px-4 h-12 bg-white border border-zinc-200 rounded-full font-semibold focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 transition-all text-zinc-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-1.5">
                                    Nota / Justificación (Obligatoria)
                                </label>
                                <textarea
                                    rows={2}
                                    value={discountNote}
                                    onChange={(e) => setDiscountNote(e.target.value)}
                                    placeholder="Ej. Mercancía con detalle estético o promoción especial."
                                    className="w-full p-3 bg-white border border-zinc-200 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 transition-all resize-none text-sm text-zinc-900"
                                />
                            </div>

                            {errorMsg && (
                                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {errorMsg}
                                </p>
                            )}

                            <div className="flex gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedItemForDiscount(null)}
                                    className="flex-1 h-12 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 active:scale-98 transition-none cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-12 text-sm font-bold text-white bg-black hover:bg-zinc-800 active:scale-98 transition-none rounded-full cursor-pointer shadow-xs"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
