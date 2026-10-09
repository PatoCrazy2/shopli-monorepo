interface CheckoutBarProps {
    totalItems: number;
    totalCart: number;
    onGoToCart: () => void;
}

export default function CheckoutBar({ totalItems, totalCart, onGoToCart }: CheckoutBarProps) {
    if (totalItems === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-6 bg-gradient-to-t from-zinc-50 via-zinc-50/80 to-transparent pointer-events-none flex justify-center z-20 select-none">
            <button
                type="button"
                onClick={onGoToCart}
                className="w-full max-w-lg h-14 sm:h-15 bg-black text-white text-base sm:text-lg font-bold rounded-full hover:bg-zinc-800 active:scale-[0.99] flex items-center justify-between pl-2.5 pr-5 sm:pl-3 sm:pr-6 shadow-xl pointer-events-auto cursor-pointer"
            >
                <span className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white text-zinc-950 rounded-full text-sm font-extrabold tabular-nums shadow-2xs">
                    {totalItems}
                </span>
                <span className="tracking-tight font-semibold">Ir a pagar</span>
                <span className="font-extrabold tracking-tight tabular-nums">
                    ${Number(totalCart).toFixed(2)}
                </span>
            </button>
        </div>
    );
}
