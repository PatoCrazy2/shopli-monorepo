import { useState, useEffect } from "react";
import { useInventory } from "./useInventory";
import type { Product, AuditItem } from "../types/inventory.types";
import { useAuth } from "../../../contexts/AuthContext";

export function useInventoryAuditWizard() {
    const { getProductsForAudit, saveAudit } = useInventory();
    const { closeShift } = useAuth();

    // Estado del Wizard
    const [auditProducts, setAuditProducts] = useState<Product[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    // Estado del paso actual
    const [countedAmount, setCountedAmount] = useState("");
    const [attempts, setAttempts] = useState(0);
    const [showWarning, setShowWarning] = useState(false);

    // Si falla el segundo intento
    const [requiresReason, setRequiresReason] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const [comments, setComments] = useState("");

    // Acumulador de resultados
    const [auditResults, setAuditResults] = useState<Omit<AuditItem, 'id' | 'auditId' | 'createdAt'>[]>([]);

    useEffect(() => {
        // Inicializar los productos al cargar
        const prods = getProductsForAudit();
        setAuditProducts(prods);
    }, [getProductsForAudit]);

    // Helper to get physical money passed via navigation state if any, else 0
    const physicalAmountPassed = 0;

    const currentProduct = auditProducts.length > 0 ? auditProducts[currentIndex] : null;

    const handleNext = () => {
        if (!currentProduct) return;

        const parsedCount = parseInt(countedAmount, 10);
        if (isNaN(parsedCount)) return;

        const discrepancy = parsedCount - currentProduct.stock;

        // Reglas de negocio de la auditoría rápida:
        // 1. Si coincide, avanzar al siguiente.
        // 2. Si es el primer intento fallido -> Mostrar alerta.
        // 3. Si es el segundo intento fallido -> Requerir motivo.

        if (discrepancy === 0) {
            recordResultAndProceed(discrepancy, parsedCount);
        } else {
            // Hay discrepancia
            if (attempts === 0) {
                setShowWarning(true);
                setAttempts(1);
                setCountedAmount(""); // Obligar a reingresar
            } else if (attempts === 1 && !requiresReason) {
                // Segundo intento falido -> Abrir campos de motivo
                setRequiresReason(true);
            } else {
                // Ya se llenó el motivo
                if (requiresReason && (!selectedReason || !comments)) {
                    alert("Debe seleccionar un motivo y dejar un comentario.");
                    return;
                }
                recordResultAndProceed(discrepancy, parsedCount);
            }
        }
    };

    const recordResultAndProceed = (discrepancy: number, countedAmount: number) => {
        if (!currentProduct) return;

        const itemResult = {
            productId: currentProduct.id,
            productName: currentProduct.nombre,
            expectedStock: currentProduct.stock,
            countedStock: countedAmount,
            discrepancy,
            reason: requiresReason ? selectedReason : undefined,
            comments: requiresReason ? comments : undefined,
        };

        const newResults = [...auditResults, itemResult];
        setAuditResults(newResults);

        // Limpiar estado para el siguiente
        setCountedAmount("");
        setAttempts(0);
        setShowWarning(false);
        setRequiresReason(false);
        setSelectedReason("");
        setComments("");

        if (currentIndex < auditProducts.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            // Finalizó la auditoría
            setIsComplete(true);
            saveAudit(newResults);

            // Cerrar el turno en AuthContext
            closeShift(physicalAmountPassed);
        }
    };

    return {
        auditProducts,
        currentIndex,
        currentProduct,
        isComplete,
        countedAmount,
        setCountedAmount,
        showWarning,
        requiresReason,
        selectedReason,
        setSelectedReason,
        comments,
        setComments,
        handleNext
    };
}
