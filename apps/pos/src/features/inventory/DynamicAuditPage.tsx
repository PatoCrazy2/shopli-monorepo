import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { db } from "../../lib/db";
import type { LocalProduct, LocalDynamicAuditItem } from "../../lib/db";

export default function DynamicAuditPage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<LocalProduct[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [countedAmount, setCountedAmount] = useState<string>("");
    const [auditId, setAuditId] = useState<string>("");
    const [isStarted, setIsStarted] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);

    // Check if an audit is already in progress when mounting
    useEffect(() => {
        const checkExisting = async () => {
            const activeId = await db.meta.get('active_audit_id');
            if (activeId) {
                setAuditId(activeId.value);
                setIsStarted(true);
                const allProducts = await db.products.toArray();
                setProducts(allProducts);
            }
        };
        checkExisting();
    }, []);

    const handleStartAudit = async () => {
        const allProducts = await db.products.toArray();
        setProducts(allProducts);

        const newAuditId = crypto.randomUUID();
        setAuditId(newAuditId);
        setIsStarted(true);
        
        await db.transaction('rw', db.meta, db.dynamicAudits, async () => {
            await db.dynamicAudits.add({
                id: newAuditId,
                startedAt: new Date().toISOString(),
                sync_status: 'PENDING'
            });
            await db.meta.put({ key: 'active_audit_id', value: newAuditId });
        });
    };

    // Fetch existing count if we navigate back
    useEffect(() => {
        const fetchCurrentCount = async () => {
            if (products.length === 0) return;
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
            <div className="flex flex-col w-full h-full bg-gray-50 items-center justify-center p-6 text-center">
                <div className="max-w-md bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4">Auditoría Dinámica</h1>
                    <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                        Estás por iniciar un proceso de **conteo ciego**. Una vez que inicies, el acceso al inventario quedará bloqueado hasta que finalices.
                    </p>
                    <button
                        onClick={handleStartAudit}
                        className="flex items-center justify-center w-full h-16 bg-black text-white rounded-xl font-bold text-xl hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
                    >
                        Iniciar Auditoría
                    </button>
                    <p className="mt-4 text-sm text-gray-400 font-medium italic">
                        * Asegúrate de tener tiempo para completar el conteo.
                    </p>
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
