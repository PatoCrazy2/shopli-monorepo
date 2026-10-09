import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { db } from "../../lib/db";
import { useAuth } from "../../contexts/AuthContext";
import type { LocalProduct } from "../../lib/db";

export default function DynamicAuditPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [products, setProducts] = useState<LocalProduct[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [countedAmount, setCountedAmount] = useState<string>("");
    const [auditId, setAuditId] = useState<string>("");
    const [isStarted, setIsStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const inputRef = useRef<HTMLInputElement>(null);

    const filterParentProducts = (allProds: LocalProduct[]) => {
        const parentIds = new Set<string>();
        allProds.forEach(p => {
            if (p.parent_id) {
                parentIds.add(p.parent_id);
            }
        });
        return allProds.filter(p => !parentIds.has(p.id));
    };

    // Check if an audit is already in progress and pre-load auditable product count
    useEffect(() => {
        const checkExisting = async () => {
            try {
                const [activeId, allProducts] = await Promise.all([
                    db.meta.get('active_audit_id'),
                    db.products.toArray()
                ]);
                setProducts(filterParentProducts(allProducts));
                if (activeId) {
                    setAuditId(activeId.value);
                    setIsStarted(true);
                }
            } finally {
                setIsLoading(false);
            }
        };
        checkExisting();
    }, []);

    const handleStartAudit = async () => {
        if (!user?.branchId) {
            alert("No se pudo determinar la sucursal activa. Por favor reinicia sesión.");
            return;
        }

        const allProducts = await db.products.toArray();
        const auditableProducts = filterParentProducts(allProducts);
        if (auditableProducts.length === 0) return;

        setProducts(auditableProducts);

        const newAuditId = crypto.randomUUID();
        setAuditId(newAuditId);
        setIsStarted(true);
        
        await db.transaction('rw', db.meta, db.dynamicAudits, async () => {
            await db.dynamicAudits.add({
                id: newAuditId,
                branchId: user.branchId,
                startedAt: new Date().toISOString(),
                sync_status: 'PENDING'
            });
            await db.meta.put({ key: 'active_audit_id', value: newAuditId });
        });
    };

    // Fetch existing count if we navigate back
    useEffect(() => {
        const fetchCurrentCount = async () => {
            if (products.length === 0 || !auditId) return;
            const currentProduct = products[currentIndex];
            const existing = await db.dynamicAuditItems
                .filter(item => item.auditId === auditId && item.productId === currentProduct.id)
                .first();
            
            if (existing && existing.countedQuantity !== null) {
                setCountedAmount(existing.countedQuantity.toString());
            } else {
                setCountedAmount("");
            }
            
            // Auto-focus input
            if (inputRef.current) {
                inputRef.current.focus();
            }
        };

        fetchCurrentCount();
    }, [currentIndex, products, auditId]);

    const handleNext = async () => {
        if (!countedAmount || isNaN(Number(countedAmount))) return;
        
        const currentProduct = products[currentIndex];
        const currentTime = new Date().toISOString();
        
        // Find if it already exists
        const existing = await db.dynamicAuditItems
            .filter(item => item.auditId === auditId && item.productId === currentProduct.id)
            .first();

        if (existing) {
            await db.dynamicAuditItems.update(existing.id, {
                countedQuantity: Number(countedAmount),
                countedAt: currentTime,
                sync_status: 'PENDING'
            });
        } else {
            await db.dynamicAuditItems.add({
                id: crypto.randomUUID(),
                auditId,
                productId: currentProduct.id,
                countedQuantity: Number(countedAmount),
                countedAt: currentTime,
                sync_status: 'PENDING'
            });
        }

        if (currentIndex < products.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Finalize: Clear the active audit block
            await db.meta.delete('active_audit_id');
            navigate("/inventario");
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (!isStarted) {
        return (
            <div className="flex flex-col w-full h-full bg-zinc-50 px-4 py-8 items-center justify-center text-center select-none font-sans">
                {/* Ícono Coherente con el Menú */}
                <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center justify-center mb-4 text-zinc-900">
                    <ClipboardCheck className="w-5 h-5" />
                </div>

                {/* Título y Conteo de Productos */}
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 mb-1.5">
                    Auditoría Dinámica
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-xs mb-7 tabular-nums">
                    Conteo físico a ciegas de{" "}
                    <strong className="font-semibold text-zinc-900">
                        {isLoading ? "—" : products.length}{" "}
                        {products.length === 1 ? "producto" : "productos"}
                    </strong>
                    .
                </p>

                {/* Botón Protagonista */}
                <button
                    type="button"
                    onClick={handleStartAudit}
                    disabled={isLoading || products.length === 0}
                    className="flex items-center justify-center gap-2 w-full max-w-[240px] h-12 px-6 bg-black text-white rounded-full font-bold text-sm hover:bg-zinc-800 active:scale-95 transition-all shadow-sm shrink-0 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
                >
                    <ClipboardCheck className="w-4 h-4 shrink-0" />
                    <span>
                        {!isLoading && products.length === 0 ? "Sin productos" : "Iniciar auditoría"}
                    </span>
                </button>

                {/* Notas Secundarias Discretas (Monocromáticas) */}
                <div className="mt-8 space-y-1 text-[11px] sm:text-xs text-zinc-400 max-w-xs">
                    <p>Puedes seguir vendiendo en caja sin afectar el conteo.</p>
                    <p>La consulta de inventario se pausará hasta finalizar.</p>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return <div className="p-6 text-center text-gray-500">Cargando productos...</div>;
    }

    const currentProduct = products[currentIndex];

    return (
        <div className="flex flex-col w-full h-full bg-gray-50 items-center justify-center p-6">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                {/* Cabecera / Barra de progreso */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Producto {currentIndex + 1} de {products.length}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                            {Math.round(((currentIndex + 1) / products.length) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-black h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Cuerpo */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-gray-900 mb-2 leading-tight">
                        {currentProduct.nombre}
                    </h2>
                    <p className="text-lg text-gray-500 font-medium">
                        {currentProduct.categoria || "Sin categoría"}
                    </p>
                </div>

                {/* Input gigante */}
                <div className="mb-10">
                    <input
                        ref={inputRef}
                        type="number"
                        inputMode="numeric"
                        value={countedAmount}
                        onChange={(e) => setCountedAmount(e.target.value)}
                        className="block w-full text-center h-24 font-black text-6xl text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black"
                        placeholder="0"
                    />
                </div>

                {/* Navegación */}
                <div className="flex gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`flex-1 h-16 rounded-lg font-bold text-lg border-2 transition-colors
                            ${currentIndex === 0
                                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        Anterior
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!countedAmount}
                        className={`flex-1 h-16 rounded-lg font-bold text-lg text-white transition-colors
                            ${!countedAmount
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-black hover:bg-zinc-800 shadow-md'}`}
                    >
                        {currentIndex < products.length - 1 ? 'Siguiente' : 'Finalizar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
