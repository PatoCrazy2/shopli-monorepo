import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Sale } from "../types/sale.types";

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
};

interface SaleListItemProps {
    sale: Sale;
}

export function SaleListItem({ sale }: SaleListItemProps) {
    const timeString = format(new Date(sale.createdAt), "hh:mm a", { locale: es });
    const ticketId = sale.id.split("-")[0].toUpperCase();

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between mb-3 min-h-[5rem]">
            <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-lg">
                    Ticket #{ticketId}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                    {timeString} • {sale.totalItems} artículo{sale.totalItems !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="text-right flex flex-col items-end">
                <span className="text-xl font-bold text-gray-900 block">
                    {formatMoney(sale.totalAmount)}
                </span>
                <span className="text-xs text-gray-400 mt-1 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                    Pagado
                </span>
            </div>
        </div>
    );
}
