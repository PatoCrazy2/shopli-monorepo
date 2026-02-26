import { useState } from "react";
import { DateFilterTabs } from "./components/DateFilterTabs";
import { SaleListItem } from "./components/SaleListItem";
import { useSalesHistory } from "./hooks/useSalesHistory";

export default function SalesHistoryScreen() {
    const [dateOffset, setDateOffset] = useState(0);
    const { getSalesByDate, getTotalsByDate } = useSalesHistory();

    const sales = getSalesByDate(dateOffset);
    const { totalAmount, totalSalesCount } = getTotalsByDate(dateOffset);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    return (
        <div className="flex flex-col w-full h-full bg-gray-50 p-6 overflow-hidden">
            {/* Header Area */}
            <div className="shrink-0 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Historial de Ventas</h1>

                <DateFilterTabs activeOffset={dateOffset} onChange={setDateOffset} />
            </div>

            {/* Summary Card */}
            <div className="shrink-0 bg-black text-white p-6 rounded-2xl mb-6 shadow-md flex justify-between items-center">
                <div>
                    <span className="text-gray-400 text-sm font-medium uppercase tracking-wider block mb-1">
                        Total del Día
                    </span>
                    <span className="text-4xl font-bold">
                        {formatMoney(totalAmount)}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-gray-400 text-sm font-medium uppercase tracking-wider block mb-1">
                        Ventas
                    </span>
                    <span className="text-2xl font-bold block">
                        {totalSalesCount}
                    </span>
                </div>
            </div>

            {/* Sales List */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                {sales.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">💸</span>
                        </div>
                        <p className="text-lg font-medium text-gray-500">No hay ventas registradas</p>
                        <p className="text-sm">En esta fecha para esta sucursal.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {sales.map((sale) => (
                            <SaleListItem key={sale.id} sale={sale} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
