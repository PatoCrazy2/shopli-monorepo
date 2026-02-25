import { CheckCircle2 } from "lucide-react";

interface SaleSuccessModalProps {
    onConfirm: () => void;
}

export default function SaleSuccessModal({ onConfirm }: SaleSuccessModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                    ¡Venta Exitosa!
                </h2>

                <p className="text-lg text-gray-500 mb-10 text-center">
                    La compra ha sido registrada correctamente en el sistema offline.
                </p>

                <button
                    onClick={onConfirm}
                    className="w-full h-16 bg-black text-white text-xl font-bold rounded-xl hover:bg-zinc-800 active:bg-zinc-900 transition-colors"
                    autoFocus
                >
                    Nueva Venta
                </button>
            </div>
        </div>
    );
}
