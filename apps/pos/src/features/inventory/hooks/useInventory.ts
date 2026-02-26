import { useState, useCallback, useEffect } from "react";
import type { Product, AuditItem, InventoryAudit } from "../types/inventory.types";
import { useAuth } from "../../../contexts/AuthContext";

const INVENTORY_STORAGE_KEY = "mock_inventory_items";
const AUDITS_STORAGE_KEY = "mock_inventory_audits";

// Generar catálogo inicial falso si no existe
const generateInitialProducts = (): Product[] => [
    { id: "1", nombre: "Coca Cola 600ml", costo: 10, precio_publico: 18, isCritical: true, stock: 45, updatedAt: new Date().toISOString() },
    { id: "2", nombre: "Cigarros Marlboro 20s", costo: 50, precio_publico: 75, isCritical: true, stock: 12, updatedAt: new Date().toISOString() },
    { id: "3", nombre: "Galletas Emperador", costo: 12, precio_publico: 19, isCritical: false, stock: 4, updatedAt: new Date().toISOString() }, // Stock bajo
    { id: "4", nombre: "Agua Ciel 1L", costo: 8, precio_publico: 15, isCritical: false, stock: 30, updatedAt: new Date().toISOString() },
    { id: "5", nombre: "Papas Sabritas 45g", costo: 14, precio_publico: 22, isCritical: false, stock: 18, updatedAt: new Date().toISOString() },
    { id: "6", nombre: "Red Bull Energy", costo: 35, precio_publico: 48, isCritical: true, stock: 3, updatedAt: new Date().toISOString() }, // Stock bajo
];

export function useInventory() {
    const { user, activeShift } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);

    // Cargar o inicializar inventario falso
    useEffect(() => {
        const storedProducts = localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (storedProducts) {
            try {
                setProducts(JSON.parse(storedProducts));
            } catch (e) {
                console.error("Error parsing inventory from localStorage", e);
                setProducts(generateInitialProducts());
            }
        } else {
            const initial = generateInitialProducts();
            setProducts(initial);
            localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(initial));
        }
    }, []);

    // Helper: Obtener productos para auditar (2 Críticos + 1 Azar)
    const getProductsForAudit = useCallback((): Product[] => {
        const criticals = products.filter(p => p.isCritical);
        const nonCriticals = products.filter(p => !p.isCritical);

        // Agarra aleatoriamente 2 críticos (o menos si no hay 2)
        const selectedCriticals = [...criticals].sort(() => 0.5 - Math.random()).slice(0, 2);

        // Agarra 1 normal (o los que falten para llegar a 3 si no hubo suficientes críticos)
        const neededRandom = 3 - selectedCriticals.length;
        const selectedRandoms = [...nonCriticals].sort(() => 0.5 - Math.random()).slice(0, neededRandom);

        return [...selectedCriticals, ...selectedRandoms];
    }, [products]);

    // Helper: Guardar resultado de la auditoría y ajustar stock virtualmente
    const saveAudit = useCallback((auditItems: Omit<AuditItem, 'id' | 'auditId' | 'createdAt'>[]) => {
        if (!user || !activeShift) return;

        // 1. Crear el record de la auditoría
        const auditRecord: InventoryAudit = {
            id: crypto.randomUUID(),
            shiftId: activeShift.id,
            userId: user.id,
            branchId: user.branchId,
            createdAt: new Date().toISOString(),
            items: auditItems.map(item => ({
                id: crypto.randomUUID(),
                auditId: 'temp_audit_id', // Se sobreescribirá abajo
                ...item,
                createdAt: new Date().toISOString()
            }))
        };

        // fix the circular reference feeling above
        auditRecord.items.forEach(i => i.auditId = auditRecord.id);

        // Guardar la auditoría
        const storedAudits = JSON.parse(localStorage.getItem(AUDITS_STORAGE_KEY) || "[]");
        localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify([...storedAudits, auditRecord]));

        // 2. Ajustar el inventario real (falso)
        const newProducts = [...products];
        auditItems.forEach(auditItem => {
            if (auditItem.discrepancy !== 0) {
                const prodIndex = newProducts.findIndex(p => p.id === auditItem.productId);
                if (prodIndex !== -1) {
                    newProducts[prodIndex] = {
                        ...newProducts[prodIndex],
                        stock: auditItem.countedStock,
                        updatedAt: new Date().toISOString()
                    };
                }
            }
        });

        setProducts(newProducts);
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(newProducts));

        console.log("Auditoría guardada localmente", auditRecord);

    }, [products, user, activeShift]);


    return {
        products,
        getProductsForAudit,
        saveAudit
    };
}
