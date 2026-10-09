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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100">
                <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
                    <div className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-zinc-600" />
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900">Ticket #{ticketId}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-200/80 rounded-full hover:bg-zinc-300 transition-colors text-zinc-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="text-center mb-6">
                        <p className="text-xs text-zinc-400 font-medium">{dateString}</p>
                        <div className="text-3xl sm:text-4xl font-black text-zinc-900 my-2 tracking-tight tabular-nums">
                            {formatMoney(sale.total)}
                        </div>
                        <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200/50">
                            Completada
                        </span>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-2">
                            Artículos ({totalItems})
                        </h3>
                        {detalles.map(detail => (
                            <div key={detail.id} className="flex justify-between items-center text-sm sm:text-base">
                                <div className="flex gap-2.5 items-center min-w-0 pr-2">
                                    <span className="font-bold text-zinc-900 shrink-0">{detail.cantidad}x</span>
                                    <span className="text-zinc-700 truncate">{detail.nombre_producto}</span>
                                </div>
                                <span className="font-semibold text-zinc-900 shrink-0 tabular-nums">
                                    {formatMoney(detail.precio_unitario_historico * detail.cantidad)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-4 sm:p-5 bg-zinc-50 border-t border-zinc-100">
                    <button 
                        onClick={onClose} 
                        className="w-full bg-black text-white font-bold text-sm sm:text-base h-12 sm:h-13 rounded-full hover:bg-zinc-800 transition-colors active:scale-[0.98]"
                    >
                        Cerrar Detalles
                    </button>
                </div>
            </div>
        </div>
    );
}
