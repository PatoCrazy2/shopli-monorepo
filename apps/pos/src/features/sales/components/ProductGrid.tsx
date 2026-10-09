import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { pullFromCloud } from "../../../lib/sync";
import VariantSelectorModal from "./VariantSelectorModal";
import { Search, Scan } from "lucide-react";

interface ProductGridProps {
    onAddToCart: (id: string) => void;
    onOpenScanner?: () => void;
}

export default function ProductGrid({ onAddToCart, onOpenScanner }: ProductGridProps) {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedParent, setSelectedParent] = useState<any | null>(null);

    // Si no hay productos al montar, intentar un pull desde la nube
    useEffect(() => {
        const trySync = async () => {
            const count = await db.products.count();
            if (count === 0 && navigator.onLine) {
                setIsSyncing(true);
                await pullFromCloud();
                setIsSyncing(false);
            }
        };
        trySync();
    }, []);

    const [searchQuery, setSearchQuery] = useState("");

    // Detección de escaneo de código de barras exacto de variante o producto único
    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) return;

        const checkExactBarcode = async () => {
            const matchedProduct = await db.products.where('codigo_interno').equalsIgnoreCase(query).first();
            if (matchedProduct) {
                // Si no tiene variantes, o si es una variante hija directamente
                const variants = await db.products.where('parent_id').equals(matchedProduct.id).toArray();
                if (variants.length === 0) {
                    onAddToCart(matchedProduct.id);
                    setSearchQuery(""); // Limpiar
                }
            }
        };

        const timer = setTimeout(checkExactBarcode, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, onAddToCart]);

    const products = useLiveQuery(async () => {
        if (!user) return [];
        const allProducts = (await db.products.toArray()).filter(p => p.isActive !== false);
        const allInventory = await db.inventory.where('sucursal_id').equals(user.branchId).toArray();

        // Mapeamos el inventario/stock a cada producto
        const productsWithStock = allProducts.map(p => {
            const inv = allInventory.find(i => i.producto_id === p.id);
            return { ...p, stock: inv ? inv.cantidad : 0 };
        });

        // Agrupamos: devolvemos solo productos padre, pero con sus variantes inyectadas
        const parents = productsWithStock.filter(p => p.parent_id === null);
        return parents.map(parent => {
            const variants = productsWithStock.filter(p => p.parent_id === parent.id);
            return {
                ...parent,
                variants
            };
        });
    }, [user]) ?? [];

    const filteredProducts = products.filter(parent => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const parentNameMatches = parent.nombre.toLowerCase().includes(query);
        const parentCodeMatches = parent.codigo_interno ? parent.codigo_interno.toLowerCase().includes(query) : false;

        if (parentNameMatches || parentCodeMatches) return true;

        // Si alguna variante coincide en código o nombre
        return parent.variants.some(v => {
            const varNameMatches = v.variante_nombre ? v.variante_nombre.toLowerCase().includes(query) : false;
            const varFullNameMatches = v.nombre.toLowerCase().includes(query);
            const varCodeMatches = v.codigo_interno ? v.codigo_interno.toLowerCase().includes(query) : false;
            return varNameMatches || varFullNameMatches || varCodeMatches;
        });
    });

    return (
        <>
            <div className="mb-4 sm:mb-6 shrink-0">
                <div className="relative flex items-center w-full bg-white border border-zinc-200/90 rounded-full h-13 sm:h-14 shadow-xs focus-within:ring-2 focus-within:ring-black/10 focus-within:border-zinc-400 transition-all select-none">
                    <Search className="w-5 h-5 text-zinc-400 absolute left-4.5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre o código..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-full bg-transparent pl-12 pr-14 text-sm sm:text-base font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none rounded-full"
                        autoFocus
                    />
                    {onOpenScanner && (
                        <button
                            type="button"
                            onClick={onOpenScanner}
                            aria-label="Escanear código con cámara"
                            className="absolute right-1.5 w-10 h-10 sm:w-11 sm:h-11 bg-black hover:bg-zinc-800 active:scale-95 text-white rounded-full flex items-center justify-center shadow-xs transition-transform cursor-pointer"
                        >
                            <Scan className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pb-24">
                {filteredProducts.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-500">
                        {isSyncing ? (
                            <>
                                <p className="font-medium">Sincronizando datos desde el servidor...</p>
                                <p className="text-sm mt-1 text-gray-400">Esto solo ocurre la primera vez.</p>
                            </>
                        ) : (
                            <>
                                <p>No se encontraron productos.</p>
                                <p className="text-sm mt-1 text-gray-400">Intenta buscar con otros términos.</p>
                            </>
                        )}
                    </div>
                )}
                
                {filteredProducts.map((product) => {
                    const hasVariants = product.variants && product.variants.length > 0;
                    // El stock del padre es la suma del stock de sus variantes (o su propio stock)
                    const totalStock = hasVariants 
                        ? product.variants.reduce((acc: number, v: any) => acc + v.stock, 0)
                        : product.stock;

                    return (
                        <button
                            key={product.id}
                            onClick={() => {
                                if (hasVariants) {
                                    setSelectedParent(product);
                                } else {
                                    onAddToCart(product.id);
                                }
                            }}
                            className={`h-32 relative border rounded-lg flex flex-col items-center justify-center p-4 transition-colors text-center shadow-sm hover:bg-gray-50 active:scale-95
                                ${totalStock <= 0 ? 'bg-red-50/20 border-red-200' : 'bg-white border-gray-200'}`}
                        >
                            {totalStock <= 0 ? (
                                <span className="absolute top-2 right-2 flex items-center justify-center bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Stock: {totalStock}
                                </span>
                            ) : hasVariants ? (
                                <span className="absolute top-2 right-2 flex items-center justify-center bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Variantes ({product.variants.length})
                                </span>
                            ) : null}
                            <span className={`font-semibold text-sm mb-2 leading-tight ${totalStock <= 0 ? 'text-gray-600' : ''}`}>{product.nombre}</span>
                            <span className="text-gray-900 font-bold text-lg">${product.precio_publico.toFixed(2)}</span>
                        </button>
                    );
                })}
            </div>

            {selectedParent && (
                <VariantSelectorModal
                    parentId={selectedParent.id}
                    parentName={selectedParent.nombre}
                    variants={selectedParent.variants}
                    onClose={() => setSelectedParent(null)}
                    onSelect={onAddToCart}
                />
            )}
        </>
    );
}
