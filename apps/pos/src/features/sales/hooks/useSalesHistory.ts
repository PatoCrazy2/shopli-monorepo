import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalSale, type LocalSaleDetail, type LocalCartItem } from "../../../lib/db";
import { useAuth } from "../../../contexts/AuthContext";
import { useNetworkSync } from "../../../hooks/useNetworkSync";
import { pushToCloud } from "../../../lib/sync";
// Imports eliminados

export function useSalesHistory() {
    const { user, activeShift } = useAuth();
    const { registerBackgroundSync } = useNetworkSync();
    
    // Live query para las ventas
    const salesArray = useLiveQuery<LocalSale[]>(() => db.sales.toArray(), []);
    const salesDb = salesArray || [];

    const addSale = useCallback(async (items: LocalCartItem[], totalAmount: number) => {
        if (!user || !activeShift) {
            console.error("No se puede registrar venta: Falta usuario o turno activo");
            return null;
        }

        const saleId = crypto.randomUUID();

        // Agrupación para mayoreo cruzado por variante
        const groupQuantities = new Map<string, number>();
        items.forEach(item => {
             const key = item.parent_id || item.producto_id;
             groupQuantities.set(key, (groupQuantities.get(key) || 0) + item.quantity);
        });

        const detalles: LocalSaleDetail[] = items.map(item => {
             const key = item.parent_id || item.producto_id;
             const groupQty = groupQuantities.get(key) || 0;

             const hasMayoreo = item.min_cantidad_mayoreo !== null && 
                                item.precio_mayoreo !== null && 
                                groupQty >= item.min_cantidad_mayoreo;
             const basePrice = hasMayoreo ? (item.precio_mayoreo as number) : item.price;
             return {
                 id: crypto.randomUUID(),
                 venta_id: saleId,
                 producto_id: item.producto_id,
                 nombre_producto: item.name,
                 cantidad: item.quantity,
                 precio_unitario_historico: basePrice,
                 descuento_manual: item.descuento_manual || 0,
                 nota_descuento: item.nota_descuento || null
             };
        });

        const newSale: LocalSale = {
            id: saleId,
            turno_id: activeShift.id,
            sucursal_id: user.branchId, // Asumimos que activeShift o user tiene la info de sucursal
            total: totalAmount,
            estado: 'COMPLETADA',
            sync_status: 'PENDING',
            fecha: new Date().toISOString()
        };

        try {
            await db.transaction('rw', db.sales, db.sale_details, db.cart, db.inventory, async () => {
                await db.sales.add(newSale);
                await db.sale_details.bulkAdd(detalles);
                
                // Descontar inventario
                for (const item of items) {
                    const invItem = await db.inventory
                        .where('[sucursal_id+producto_id]')
                        .equals([user.branchId, item.producto_id])
                        .first();
                    
                    if (invItem) {
                        await db.inventory.update(invItem.id, {
                            cantidad: invItem.cantidad - item.quantity,
                            updatedAt: new Date().toISOString()
                        });
                    } else {
                        await db.inventory.add({
                            id: crypto.randomUUID(),
                            sucursal_id: user.branchId,
                            producto_id: item.producto_id,
                            cantidad: -item.quantity,
                            updatedAt: new Date().toISOString()
                        });
                    }
                }

                // Limpiar carrito
                await db.cart.clear();
            });

            // Registrar el intento de Background Sync de inmediato si estamos en entorno productivo/PWA
            await registerBackgroundSync();

            if (navigator.onLine) {
                pushToCloud().catch(err => console.error("Error pushing sale immediately:", err));
            }

            return newSale;
        } catch (error) {
            console.error("Error al registrar la venta local:", error);
            return null;
        }
    }, [user, activeShift]);

    // Función pura para filtrar por fecha (Adaptada a Dexie o array en memoria)
    const getSalesByDate = useCallback((dateOffsetDays: number) => {
        if (!user) return [];

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - dateOffsetDays);
        const targetDateString = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

        return salesDb.filter((sale: LocalSale) => {
            const saleDateString = sale.fecha.split("T")[0];
            return sale.sucursal_id === user.branchId && saleDateString === targetDateString;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salesDb?.length, user]);

    // Función auxiliar para obtener totales
    const getTotalsByDate = useCallback((dateOffsetDays: number) => {
        const filteredSales = getSalesByDate(dateOffsetDays);
        const totalAmount = filteredSales.reduce((acc: number, sale: LocalSale) => acc + sale.total, 0);
        const totalSalesCount = filteredSales.length;

        return { totalAmount, totalSalesCount };
    }, [getSalesByDate]);


    return {
        sales: salesDb,
        addSale,
        getSalesByDate,
        getTotalsByDate
    };
}
