import { Check } from "lucide-react";

interface SaleSuccessModalProps {
    onConfirm: () => void;
}

export default function SaleSuccessModal({ onConfirm }: SaleSuccessModalProps) {
    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] font-sans select-none">
            <div className="bg-white rounded-3xl p-7 sm:p-8 max-w-sm sm:max-w-md w-full border border-zinc-200/80 shadow-2xl flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-600 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-600/25 animate-check-pop">
                    <Check className="w-10 h-10 text-white stroke-[3]" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 mb-2">
                    ¡Venta Exitosa!
                </h2>

                <p className="text-sm sm:text-base text-zinc-500 leading-relaxed mb-8 max-w-xs">
                    La compra ha sido registrada correctamente en el sistema offline.
                </p>

                <button
                    type="button"
                    onClick={onConfirm}
                    className="w-full h-14 bg-black text-white text-base sm:text-lg font-bold rounded-full hover:bg-zinc-800 active:scale-[0.99] transition-transform shadow-md cursor-pointer"
                    autoFocus
                >
                    Nueva Venta
                </button>
            </div>
        </div>
    );
}
