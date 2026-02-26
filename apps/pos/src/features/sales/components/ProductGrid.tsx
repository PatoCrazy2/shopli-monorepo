interface ProductGridProps {
    onAddToCart: (id: number) => void;
}

export default function ProductGrid({ onAddToCart }: ProductGridProps) {
    return (
        <>
            <div className="mb-6 shrink-0">
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    className="w-full h-14 px-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400 bg-white"
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-24">
                {/* Mock Product Cards */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <button
                        key={i}
                        onClick={() => onAddToCart(i)}
                        className="h-32 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center p-4 hover:bg-gray-100 active:bg-gray-200"
                    >
                        <span className="font-semibold text-lg">Producto {i}</span>
                        <span className="text-gray-500">$ {100 * i}.00</span>
                    </button>
                ))}
            </div>
        </>
    );
}
