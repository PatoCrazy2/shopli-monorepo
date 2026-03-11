import { useLiveQuery } from "dexie-react-hooks";
import { db, seedLocalData } from "../../../lib/db";
import { useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";

interface ProductGridProps {
    onAddToCart: (id: string) => void;
}

export default function ProductGrid({ onAddToCart }: ProductGridProps) {
    const { user } = useAuth();

    // For development/testing: auto-seed data if empty
    useEffect(() => {
        seedLocalData();
    }, []);

    const products = useLiveQuery(async () => {
        if (!user) return [];
        const allProducts = await db.products.toArray();
        const allInventory = await db.inventory.where('sucursal_id').equals(user.branchId).toArray();

        return allProducts.map(p => {
            const inv = allInventory.find(i => i.producto_id === p.id);
            return { ...p, stock: inv ? inv.cantidad : 0 };
        });
    }, [user]) ?? [];

    return (
        <>
            <div className="mb-4 sm:mb-6 shrink-0 flex gap-2">
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    className="flex-1 h-12 sm:h-14 px-3 sm:px-4 text-base sm:text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400 bg-white"
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pb-24">
                {products.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-500">
                        <p>No hay productos en el catálogo local.</p>
                        <button 
                            onClick={() => seedLocalData()} 
                            className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200"
                        >
                            Cargar Datos de Prueba
                        </button>
                    </div>
                )}
                
                {products.map((product) => (
                    <button
                        key={product.id}
                        onClick={() => onAddToCart(product.id)}
                        className={`h-32 relative border rounded-lg flex flex-col items-center justify-center p-4 transition-colors text-center shadow-sm hover:bg-gray-50 active:scale-95
                            ${product.stock <= 0 ? 'bg-red-50/20 border-red-200' : 'bg-white border-gray-200'}`}
                    >
                        {product.stock <= 0 && (
                            <span className="absolute top-2 right-2 flex items-center justify-center bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Stock: {product.stock}
                            </span>
                        )}
                        <span className={`font-semibold text-sm mb-2 leading-tight ${product.stock <= 0 ? 'text-gray-600' : ''}`}>{product.nombre}</span>
                        <span className="text-gray-900 font-bold text-lg">${product.precio_publico.toFixed(2)}</span>
                    </button>
                ))}
            </div>
        </>
    );
}
