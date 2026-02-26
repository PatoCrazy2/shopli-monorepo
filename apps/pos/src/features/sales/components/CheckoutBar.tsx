interface CheckoutBarProps {
    totalItems: number;
    totalCart: number;
    onGoToCart: () => void;
}

export default function CheckoutBar({ totalItems, totalCart, onGoToCart }: CheckoutBarProps) {
    if (totalItems === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none flex justify-center">
            <button
                onClick={onGoToCart}
                className="w-full max-w-lg h-16 bg-black text-white text-xl font-bold rounded-lg hover:bg-zinc-800 active:bg-zinc-900 flex items-center justify-between px-6 shadow-2xl pointer-events-auto"
            >
                <span className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-md text-sm">
                    {totalItems}
                </span>
                <span>Ir a pagar</span>
                <span>${totalCart}.00</span>
            </button>
        </div>
    );
}
