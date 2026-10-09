import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Minus, Plus, ArrowLeft, ArrowRight, Check } from "lucide-react";
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

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "" || /^\d+$/.test(val)) {
            setCountedAmount(val);
        }
    };

    const handleIncrement = () => {
        const current = countedAmount === "" ? 0 : parseInt(countedAmount, 10);
        setCountedAmount(String((isNaN(current) ? 0 : current) + 1));
    };

    const handleDecrement = () => {
        const current = countedAmount === "" ? 0 : parseInt(countedAmount, 10);
        const next = Math.max(0, (isNaN(current) ? 0 : current) - 1);
        setCountedAmount(String(next));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && countedAmount !== "") {
            e.preventDefault();
            handleNext();
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
        return (
            <div className="flex flex-col w-full h-full bg-zinc-50 items-center justify-center p-6 text-center text-xs sm:text-sm text-zinc-400 font-medium font-sans">
                Cargando productos...
            </div>
        );
    }

    const currentProduct = products[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / products.length) * 100);
    const isLastProduct = currentIndex === products.length - 1;
    const canDecrement = countedAmount !== "" && Number(countedAmount) > 0;

    return (
        <div className="flex flex-col justify-between w-full h-full bg-zinc-50 p-4 sm:p-8 select-none font-sans overflow-y-auto">
            {/* Zona Superior: Barra de Progreso de Ancho Completo */}
            <div className="w-full max-w-3xl mx-auto shrink-0">
                <div className="flex justify-between items-center mb-2.5 tabular-nums">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Producto {currentIndex + 1} de {products.length}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900">
                        {progressPercent}%
                    </span>
                </div>
                <div className="w-full bg-zinc-200/80 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-black h-full rounded-full transition-all duration-150"
                        style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Zona Central: Producto Protagonista + Captura Píldora */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-6">
                <div className="text-center mb-8 sm:mb-10">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 leading-tight mb-2">
                        {currentProduct.nombre}
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-400 font-medium">
                        {currentProduct.categoria || "Sin categoría"}
                    </p>
                </div>

                {/* Captura Píldora + Botones Circulares - / + */}
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={handleDecrement}
                            disabled={!canDecrement}
                            aria-label="Disminuir cantidad"
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100 active:scale-95 flex items-center justify-center shadow-xs shrink-0 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                            <Minus className="w-6 h-6" />
                        </button>

                        <input
                            id="countedAmount"
                            ref={inputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={countedAmount}
                            onChange={handleAmountChange}
                            onKeyDown={handleKeyDown}
                            placeholder="0"
                            aria-label="Existencia física contada"
                            className="flex-1 min-w-0 h-16 sm:h-20 bg-white border border-zinc-200 rounded-full text-center text-4xl sm:text-5xl font-black text-zinc-900 placeholder:text-zinc-300 tabular-nums shadow-xs focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
                        />

                        <button
                            type="button"
                            onClick={handleIncrement}
                            aria-label="Aumentar cantidad"
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100 active:scale-95 flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Zona Inferior: Navegación Anclada al Pie */}
            <div className="w-full max-w-3xl mx-auto shrink-0 flex items-center gap-3 sm:gap-4">
                <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex-1 h-13 sm:h-14 rounded-full font-bold text-sm sm:text-base bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 active:scale-95 shadow-2xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span>Anterior</span>
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    disabled={countedAmount === ""}
                    className="flex-1 h-13 sm:h-14 rounded-full font-bold text-sm sm:text-base bg-black text-white hover:bg-zinc-800 active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:pointer-events-none cursor-pointer"
                >
                    <span>{isLastProduct ? "Finalizar" : "Siguiente"}</span>
                    {isLastProduct ? (
                        <Check className="w-4 h-4 shrink-0" />
                    ) : (
                        <ArrowRight className="w-4 h-4 shrink-0" />
                    )}
                </button>
            </div>
        </div>
    );
}
