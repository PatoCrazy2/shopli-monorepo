import { useState } from "react";
import { DateFilterSelect } from "./components/DateFilterSelect";
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
        <div className="flex flex-col w-full h-full bg-zinc-50 p-4 sm:p-6 overflow-hidden">
            {/* Header Area Compacto */}
            <div className="shrink-0 flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-2xl font-black text-zinc-900 tracking-tight truncate">
                        Historial de Ventas
                    </h1>
                    <p className="text-xs text-zinc-500 font-medium hidden sm:block truncate">
                        Consulta los tickets de venta por fecha
                    </p>
                </div>

                <DateFilterSelect activeOffset={dateOffset} onChange={setDateOffset} />
            </div>

            {/* Summary Card de 2 Columnas Balanceadas */}
            <div className="shrink-0 bg-black text-white p-4 sm:p-5 rounded-2xl mb-4 shadow-sm border border-zinc-900 grid grid-cols-2 divide-x divide-zinc-800">
                <div className="pr-3 sm:pr-5 flex flex-col justify-center">
                    <span className="text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1">
                        Total del Día
                    </span>
                    <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                        {formatMoney(totalAmount)}
                    </span>
                </div>
                <div className="pl-3 sm:pl-5 flex flex-col justify-center">
                    <span className="text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1">
                        Operaciones
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                            {totalSalesCount}
                        </span>
                        <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                            {totalSalesCount === 1 ? 'venta' : 'ventas'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sales List */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                {sales.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-12">
                        <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mb-4 text-2xl">
                            💸
                        </div>
                        <p className="text-base sm:text-lg font-bold text-zinc-700">No hay ventas registradas</p>
                        <p className="text-xs sm:text-sm text-zinc-500">En esta fecha para esta sucursal.</p>
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
