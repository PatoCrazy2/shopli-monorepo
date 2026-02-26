import { useState, useCallback, useEffect } from "react";
import type { Sale } from "../types/sale.types";
import { useAuth } from "../../../contexts/AuthContext";

const SALES_STORAGE_KEY = "mock_sales_history";

export function useSalesHistory() {
    const { user, activeShift } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);

    // Cargar ventas desde localStorage inicial
    useEffect(() => {
        const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
        if (storedSales) {
            try {
                setSales(JSON.parse(storedSales));
            } catch (e) {
                console.error("Error parsing sales from localStorage", e);
                setSales([]);
            }
        }
    }, []);

    const addSale = useCallback((items: any[], totalAmount: number, totalItems: number) => {
        if (!user || !activeShift) {
            console.error("No se puede registrar venta: Falta usuario o turno activo");
            return null;
        }

        const newSale: Sale = {
            id: crypto.randomUUID(),
            branchId: user.branchId,
            userId: user.id,
            shiftId: activeShift.id,
            items,
            totalAmount,
            totalItems,
            createdAt: new Date().toISOString(),
        };

        setSales((prev) => {
            const updated = [newSale, ...prev];
            localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });

        return newSale;
    }, [user, activeShift]);

    // Función pura para filtrar por fecha y branch
    const getSalesByDate = useCallback((dateOffsetDays: number) => {
        if (!user) return [];

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - dateOffsetDays);
        const targetDateString = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

        return sales.filter((sale) => {
            const saleDateString = sale.createdAt.split("T")[0];
            return sale.branchId === user.branchId && saleDateString === targetDateString;
        });
    }, [sales, user]);

    // Función auxiliar para obtener totales
    const getTotalsByDate = useCallback((dateOffsetDays: number) => {
        const filteredSales = getSalesByDate(dateOffsetDays);
        const totalAmount = filteredSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
        const totalSalesCount = filteredSales.length;

        return { totalAmount, totalSalesCount };
    }, [getSalesByDate]);


    return {
        sales,
        addSale,
        getSalesByDate,
        getTotalsByDate
    };
}
