import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import type { Product, AuditItem } from "../types/inventory.types";
import { useAuth } from "../../../contexts/AuthContext";

export function useInventory() {
    const { user, activeShift } = useAuth();
    
    const productsDb = useLiveQuery(async () => {
        if (!user) return [];
        const allProducts = await db.products.toArray();
        const allInventory = await db.inventory.where('sucursal_id').equals(user.branchId).toArray();
        
        return allProducts.map(p => {
            const inv = allInventory.find(i => i.producto_id === p.id);
            return {
                id: p.id,
                nombre: p.nombre,
                codigo_interno: p.codigo_interno || undefined,
                descripcion: p.descripcion || undefined,
                costo: p.costo,
                precio_publico: p.precio_publico,
                categoria: p.categoria || undefined,
                isCritical: p.isCritical,
                stock: inv ? inv.cantidad : 0,
                updatedAt: inv ? inv.updatedAt : p.updatedAt
            } as Product;
        });
    }, [user]) ?? [];

    const getProductsForAudit = useCallback((): Product[] => {
        const criticals = productsDb.filter(p => p.isCritical);
        const nonCriticals = productsDb.filter(p => !p.isCritical);

        const selectedCriticals = [...criticals].sort(() => 0.5 - Math.random()).slice(0, 2);
        const neededRandom = 3 - selectedCriticals.length;
        const selectedRandoms = [...nonCriticals].sort(() => 0.5 - Math.random()).slice(0, neededRandom);

        return [...selectedCriticals, ...selectedRandoms];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productsDb?.length]);

    const saveAudit = useCallback(async (auditItems: Omit<AuditItem, 'id' | 'auditId' | 'createdAt'>[]) => {
        if (!user || !activeShift) return;

        const auditRecord = {
            id: crypto.randomUUID(),
            shiftId: activeShift.id,
            userId: user.id,
            branchId: user.branchId,
            createdAt: new Date().toISOString(),
            sync_status: 'PENDING' as const,
            items: auditItems.map(item => ({
                id: crypto.randomUUID(),
                auditId: 'temp_audit_id',
                ...item,
                createdAt: new Date().toISOString()
            }))
        };
        auditRecord.items.forEach(i => i.auditId = auditRecord.id);
        
        try {
            await db.transaction('rw', db.audits, db.inventory, async () => {
                await db.audits.add(auditRecord);
                
                // Actualiza el inventario en Dexie
                for (const auditItem of auditItems) {
                    if (auditItem.discrepancy !== 0) {
                        const invItem = await db.inventory
                            .where('[sucursal_id+producto_id]')
                            .equals([user.branchId, auditItem.productId])
                            .first();
                        
                        if (invItem) {
                            await db.inventory.update(invItem.id, {
                                cantidad: auditItem.countedStock,
                                updatedAt: new Date().toISOString()
                            });
                        } else {
                            await db.inventory.add({
                                id: crypto.randomUUID(),
                                sucursal_id: user.branchId,
                                producto_id: auditItem.productId,
                                cantidad: auditItem.countedStock,
                                updatedAt: new Date().toISOString()
                            });
                        }
                    }
                }
            });
            console.log("Auditoría guardada exitosamente en BD local:", auditRecord);
        } catch (error) {
            console.error("Error guardando auditoría en BD local", error);
        }
    }, [user, activeShift]);

    return {
        products: productsDb,
        getProductsForAudit,
        saveAudit
    };
}
