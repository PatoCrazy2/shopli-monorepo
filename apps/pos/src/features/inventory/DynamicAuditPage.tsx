import { ClipboardCheck, Minus, Plus, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useDynamicAudit } from "./hooks/useDynamicAudit";

export default function DynamicAuditPage() {
    const {
        products,
        currentIndex,
        currentProduct,
        countedAmount,
        isStarted,
        isLoading,
        progressPercent,
        isLastProduct,
        canDecrement,
        inputRef,
        handleStartAudit,
        handleNext,
        handlePrev,
        handleAmountChange,
        handleIncrement,
        handleDecrement,
        handleKeyDown,
    } = useDynamicAudit();

    if (!isStarted) {
        return (
            <div className="flex flex-col w-full h-full bg-zinc-50 px-4 py-8 items-center justify-center text-center select-none font-sans">
                {/* Ícono Coherente con el Menú */}
                <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex items-center justify-center mb-4 text-zinc-900">
                    <ClipboardCheck className="w-5 h-5" />
                </div>

                {/* Título y Conteo de Productos */}
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 mb-1.5">
                    Auditoría Dinámica
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-xs mb-7 tabular-nums">
                    Conteo físico a ciegas de{" "}
                    <strong className="font-semibold text-zinc-900">
                        {isLoading ? "—" : products.length}{" "}
                        {products.length === 1 ? "producto" : "productos"}
                    </strong>
                    .
                </p>

                {/* Botón Protagonista */}
                <button
                    type="button"
                    onClick={handleStartAudit}
                    disabled={isLoading || products.length === 0}
                    className="flex items-center justify-center gap-2 w-full max-w-[240px] h-12 px-6 bg-black text-white rounded-full font-bold text-sm hover:bg-zinc-800 active:scale-95 transition-all shadow-sm shrink-0 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
                >
                    <ClipboardCheck className="w-4 h-4 shrink-0" />
                    <span>
                        {!isLoading && products.length === 0 ? "Sin productos" : "Iniciar auditoría"}
                    </span>
                </button>

                {/* Notas Secundarias Discretas (Monocromáticas) */}
                <div className="mt-8 space-y-1 text-[11px] sm:text-xs text-zinc-400 max-w-xs">
                    <p>Puedes seguir vendiendo en caja sin afectar el conteo.</p>
                    <p>La consulta de inventario se pausará hasta finalizar.</p>
                </div>
            </div>
        );
    }

    if (products.length === 0 || !currentProduct) {
        return (
            <div className="flex flex-col w-full h-full bg-zinc-50 items-center justify-center p-6 text-center text-xs sm:text-sm text-zinc-400 font-medium font-sans">
                Cargando productos...
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-between w-full h-full bg-zinc-50 p-4 sm:p-8 select-none font-sans overflow-y-auto">
            {/* Zona Superior: Barra de Progreso de Ancho Completo */}
            <div className="w-full max-w-3xl mx-auto shrink-0">
                <div className="flex justify-between items-center mb-2.5 tabular-nums">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Producto {currentIndex + 1} de {products.length}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900">
                        {progressPercent}%
                    </span>
                </div>
                <div className="w-full bg-zinc-200/80 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-black h-full rounded-full transition-all duration-150"
                        style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Zona Central: Producto Protagonista + Captura Píldora */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-6">
                <div className="text-center mb-8 sm:mb-10">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 leading-tight mb-2">
                        {currentProduct.nombre}
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-400 font-medium">
                        {currentProduct.categoria || "Sin categoría"}
                    </p>
                </div>

                {/* Captura Píldora + Botones Circulares - / + */}
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={handleDecrement}
                            disabled={!canDecrement}
                            aria-label="Disminuir cantidad"
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100 active:scale-95 flex items-center justify-center shadow-xs shrink-0 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                            <Minus className="w-6 h-6" />
                        </button>

                        <input
                            id="countedAmount"
                            ref={inputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={countedAmount}
                            onChange={handleAmountChange}
                            onKeyDown={handleKeyDown}
                            placeholder="0"
                            aria-label="Existencia física contada"
                            className="flex-1 min-w-0 h-16 sm:h-20 bg-white border border-zinc-200 rounded-full text-center text-4xl sm:text-5xl font-black text-zinc-900 placeholder:text-zinc-300 tabular-nums shadow-xs focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
                        />

                        <button
                            type="button"
                            onClick={handleIncrement}
                            aria-label="Aumentar cantidad"
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100 active:scale-95 flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Zona Inferior: Navegación Anclada al Pie */}
            <div className="w-full max-w-3xl mx-auto shrink-0 flex items-center gap-3 sm:gap-4">
                <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex-1 h-13 sm:h-14 rounded-full font-bold text-sm sm:text-base bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 active:scale-95 shadow-2xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span>Anterior</span>
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    disabled={countedAmount === ""}
                    className="flex-1 h-13 sm:h-14 rounded-full font-bold text-sm sm:text-base bg-black text-white hover:bg-zinc-800 active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:pointer-events-none cursor-pointer"
                >
                    <span>{isLastProduct ? "Finalizar" : "Siguiente"}</span>
                    {isLastProduct ? (
                        <Check className="w-4 h-4 shrink-0" />
                    ) : (
                        <ArrowRight className="w-4 h-4 shrink-0" />
                    )}
                </button>
            </div>
        </div>
    );
}
