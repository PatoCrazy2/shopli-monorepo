import { X, Receipt } from "lucide-react";
import type { LocalSale, LocalSaleDetail } from "../../../lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SaleDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: LocalSale;
    detalles: LocalSaleDetail[];
}

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

export function SaleDetailModal({ isOpen, onClose, sale, detalles }: SaleDetailModalProps) {
    if (!isOpen) return null;

    // Extract ticket ID matching the new format (yyMMdd-contador-uuid) or fallback to short uuid
    const idParts = sale.id.split("-");
    const isNewFormat = idParts.length >= 3 && !isNaN(Number(idParts[0])) && !isNaN(Number(idParts[1]));
    const ticketId = isNewFormat 
        ? `${idParts[0]}-${idParts[1]}` 
        : idParts[0].toUpperCase();
    const dateString = format(new Date(sale.fecha), "dd MMM yyyy, hh:mm a", { locale: es });
    
    // Totalizing is safely passed down or re-calculated
    const totalItems = detalles.reduce((acc, curr) => acc + curr.cantidad, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-gray-500" />
                        <h2 className="text-xl font-bold">Ticket #{ticketId}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-500">{dateString}</p>
                        <div className="text-4xl font-bold my-2">{formatMoney(sale.total)}</div>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            Completada
                        </span>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Artículos ({totalItems})</h3>
                        {detalles.map(detail => (
                            <div key={detail.id} className="flex justify-between items-center text-lg">
                                <div className="flex gap-3 items-center">
                                    <span className="font-bold text-gray-900">{detail.cantidad}x</span>
                                    <span className="text-gray-700">{detail.nombre_producto}</span>
                                </div>
                                <span className="font-medium text-gray-900">{formatMoney(detail.precio_unitario_historico * detail.cantidad)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button 
                        onClick={onClose} 
                        className="w-full bg-black text-white font-bold text-lg h-14 rounded-xl hover:bg-gray-800 transition-colors active:scale-[0.98]"
                    >
                        Cerrar Detalles
                    </button>
                </div>
            </div>
        </div>
    );
}
