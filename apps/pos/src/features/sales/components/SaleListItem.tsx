import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { LocalSale } from "../../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { SaleDetailModal } from "./SaleDetailModal";

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
};

interface SaleListItemProps {
    sale: LocalSale;
}

export function SaleListItem({ sale }: SaleListItemProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const timeString = format(new Date(sale.fecha), "hh:mm a", { locale: es });
    
    // Extract ticket ID matching the new format (yyMMdd-contador-uuid) or fallback to short uuid
    const idParts = sale.id.split("-");
    const isNewFormat = idParts.length >= 3 && !isNaN(Number(idParts[0])) && !isNaN(Number(idParts[1]));
    const ticketId = isNewFormat 
        ? `${idParts[0]}-${idParts[1]}` 
        : idParts[0].toUpperCase();
    
    // Consultar dinámicamente sus detalles
    const detalles = useLiveQuery(() => db.sale_details.where('venta_id').equals(sale.id).toArray(), [sale.id]) ?? [];
    const totalItems = detalles.reduce((acc, current) => acc + current.cantidad, 0);

    return (
        <>
            <div 
                onClick={() => setIsModalOpen(true)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between mb-3 min-h-[5rem] cursor-pointer hover:bg-gray-50 transition-colors"
            >
            <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-lg">
                    Ticket #{ticketId}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                    {timeString} • {totalItems} artículo{totalItems !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="text-right flex flex-col items-end">
                <span className="text-xl font-bold text-gray-900 block">
                    {formatMoney(sale.total)}
                </span>
                <span className="text-xs text-gray-400 mt-1 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                    Pagado
                </span>
            </div>
            </div>
            
            <SaleDetailModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                sale={sale} 
                detalles={detalles} 
            />
        </>
    );
}
