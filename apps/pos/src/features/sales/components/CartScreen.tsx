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

    const handleSaveDiscount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemForDiscount) return;

        const discountNum = Number(discountAmount) || 0;
        if (discountNum < 0) {
            setErrorMsg('El descuento no puede ser negativo.');
            return;
        }

        const hasMayoreo = selectedItemForDiscount.min_cantidad_mayoreo !== null && 
                           selectedItemForDiscount.precio_mayoreo !== null && 
                           selectedItemForDiscount.quantity >= selectedItemForDiscount.min_cantidad_mayoreo;
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
        <div className="flex-1 flex flex-col bg-white relative">
            <div className="h-14 sm:h-16 flex items-center px-4 sm:px-6 border-b border-gray-200 gap-3 sm:gap-4 shrink-0">
                <button
                    onClick={onBack}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center -ml-2 sm:-ml-3 hover:bg-gray-100 active:bg-gray-200 rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Carrito ({totalItems})</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
                {cartItems.map(item => {
                    const inv = inventoryDb.find(i => i.producto_id === item.producto_id);
                    const currentStock = inv ? inv.cantidad : 0;
                    const stockIsLow = currentStock <= 0;
                    
                    const hasMayoreo = item.min_cantidad_mayoreo !== null && 
                                       item.precio_mayoreo !== null && 
                                       item.quantity >= item.min_cantidad_mayoreo;
                    const basePrice = hasMayoreo ? (item.precio_mayoreo as number) : item.price;
                    const itemTotal = roundCustom(basePrice * item.quantity) - (item.descuento_manual || 0);

                    return (
                    <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border shadow-sm rounded-xl transition-colors gap-3 sm:gap-0 ${stockIsLow ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-gray-100'}`}>
                        <div className="flex-1 pr-2">
                            <div className="flex items-start gap-2">
                                <p className="font-semibold text-lg leading-tight">{item.name}</p>
                                {stockIsLow && (
                                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                                        <AlertTriangle className="w-3 h-3" />
                                        Stock: {currentStock}
                                    </span>
                                )}
                            </div>

                            {/* Precios con Mayoreo Tachado y Descuento Manual */}
                            <div className="mt-1 flex flex-col gap-0.5">
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                                    <span className="font-bold text-gray-950 text-lg">
                                        ${itemTotal}.00
                                    </span>
                                    {hasMayoreo && (
                                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                                            Oferta Aplicada (<s>${item.price}</s> ${item.precio_mayoreo}/u)
                                        </span>
                                    )}
                                </div>
                                {item.descuento_manual > 0 && (
                                    <span className="text-xs text-amber-700 font-medium">
                                        Descuento manual: -${item.descuento_manual}.00 ({item.nota_descuento})
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg">
                                <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                    className="p-2 sm:p-3 hover:bg-gray-100 active:bg-gray-200 rounded-l-lg transition-colors"
                                >
                                    <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                                </button>
                                <span className="w-10 sm:w-12 text-center font-semibold text-lg">{item.quantity}</span>
                                <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                    className="p-2 sm:p-3 hover:bg-gray-100 active:bg-gray-200 rounded-r-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                                </button>
                            </div>

                            <div className="flex items-center gap-1">
                                {/* Botón de Descuento Manual */}
                                <button
                                    onClick={() => {
                                        setSelectedItemForDiscount(item);
                                        setDiscountAmount(item.descuento_manual > 0 ? String(item.descuento_manual) : '');
                                        setDiscountNote(item.nota_descuento || '');
                                        setErrorMsg('');
                                    }}
                                    className={`p-2 sm:p-3 rounded-lg transition-colors ${item.descuento_manual > 0 
                                        ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
                                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                                    title="Descuento Manual"
                                >
                                    <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>

                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="p-2 sm:p-3 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                )})}
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200 shrink-0">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <span className="text-lg sm:text-xl font-medium text-gray-500">Total</span>
                    <span className="text-3xl sm:text-4xl font-bold">${totalCart}.00</span>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={cartItems.length === 0}
                    className={`w-full h-14 sm:h-16 text-xl font-bold rounded-lg flex items-center justify-center transition-colors ${cartItems.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-zinc-800 active:bg-zinc-900'
                        }`}
                >
                    Cobrar
                </button>
            </div>

            {/* Modal para Descuento Manual */}
            {selectedItemForDiscount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-150">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-amber-500" />
                                Descuento Manual: {selectedItemForDiscount.name}
                            </h3>
                            <button
                                onClick={() => setSelectedItemForDiscount(null)}
                                className="text-gray-400 hover:bg-gray-100 hover:text-gray-700 p-1.5 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDiscount} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Nota / Justificación (Obligatoria si se aplica descuento)
                                </label>
                                <textarea
                                    rows={2}
                                    value={discountNote}
                                    onChange={(e) => setDiscountNote(e.target.value)}
                                    placeholder="Ej. Mercancía con detalle estético o promoción especial."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all resize-none text-sm"
                                />
                            </div>

                            {errorMsg && (
                                <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {errorMsg}
                                </p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedItemForDiscount(null)}
                                    className="flex-1 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-98 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 text-sm font-bold text-white bg-black hover:bg-zinc-800 active:scale-98 transition-all rounded-xl"
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
