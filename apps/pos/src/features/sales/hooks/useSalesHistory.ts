import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalSale, type LocalSaleDetail, type LocalCartItem } from "../../../lib/db";
import { useAuth } from "../../../contexts/AuthContext";
// Imports eliminados

export function useSalesHistory() {
    const { user, activeShift } = useAuth();
    
    // Live query para las ventas
    const salesArray = useLiveQuery<LocalSale[]>(() => db.sales.toArray(), []);
    const salesDb = salesArray || [];

    const addSale = useCallback(async (items: LocalCartItem[], totalAmount: number) => {
        if (!user || !activeShift) {
            console.error("No se puede registrar venta: Falta usuario o turno activo");
            return null;
        }

        const saleId = crypto.randomUUID();

        const detalles: LocalSaleDetail[] = items.map(item => ({
             id: crypto.randomUUID(),
             venta_id: saleId,
             producto_id: item.producto_id,
             nombre_producto: item.name,
             cantidad: item.quantity,
             precio_unitario_historico: item.price
        }));

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
