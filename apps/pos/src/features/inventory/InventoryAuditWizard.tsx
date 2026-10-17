import { AlertTriangle, Minus, Plus, ArrowRight, Check } from "lucide-react";
import { useInventoryAuditWizard } from "./hooks/useInventoryAuditWizard";
import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { pushToCloud } from "../../lib/sync";
import { db } from "../../lib/db";

export default function InventoryAuditWizard() {
    const { closeShift } = useAuth();

    // Bloqueo de navegación nativa (Atrás/Adelante del navegador)
    useEffect(() => {
        window.history.pushState(null, "", window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    const {
        auditProducts,
        currentIndex,
        currentProduct,
        countedAmount,
        setCountedAmount,
        showWarning,
        requiresReason,
        selectedReason,
        setSelectedReason,
        comments,
        setComments,
        handleNext,
        physicalAmountPassed
    } = useInventoryAuditWizard();

    const handleCompleteClosing = async () => {
        try {
            // 1. Activar pantalla completa de sincronización a nivel raíz y silenciar HardStopSyncScreen
            await db.meta.put({ key: 'isClosingShiftSync', value: 'syncing' });

            // 2. Cerrar turno en Dexie
            await closeShift(physicalAmountPassed);

            // 3. Subir ventas, turno y auditoría a la nube
            const pushResult = await pushToCloud();

            if (pushResult.success) {
                // 4. Estado 2: Éxito con checkmark y cuenta regresiva híbrida (ClosingShiftSyncScreen orquesta la navegación)
                await db.meta.put({ key: 'isClosingShiftSync', value: 'success' });
            } else {
                // Si falló el push (offline o error), desmontar pantalla para dar paso a HardStopSyncScreen
                await db.meta.delete('isClosingShiftSync');
            }
        } catch (err) {
            console.error("Error al finalizar cierre de turno:", err);
            await db.meta.delete('isClosingShiftSync');
        }
    };

    const handleButtonClick = async () => {
        const isLastItem = currentIndex === auditProducts.length - 1;
        const willComplete = handleNext();
        if (isLastItem && willComplete) {
            await handleCompleteClosing();
        }
    };

    const handleIncrement = () => {
        const current = parseInt(countedAmount || "0", 10);
        setCountedAmount(String(isNaN(current) ? 1 : current + 1));
    };

    const handleDecrement = () => {
        const current = parseInt(countedAmount || "0", 10);
        if (!isNaN(current) && current > 0) {
            setCountedAmount(String(current - 1));
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, "");
        setCountedAmount(val);
    };

    if (auditProducts.length === 0 || !currentProduct) {
        return (
            <div className="flex flex-col w-full h-full bg-zinc-50 items-center justify-center p-6 text-center text-xs sm:text-sm text-zinc-400 font-medium font-sans select-none">
                Cargando productos de auditoría...
            </div>
        );
    }

    const isLastItem = currentIndex === auditProducts.length - 1;
    const canDecrement = parseInt(countedAmount || "0", 10) > 0;
    const hasInput = countedAmount.trim() !== "";
    const isActionDisabled = !hasInput || (requiresReason && (!selectedReason || !comments.trim()));

    const buttonText = !hasInput
        ? "Ingresa una cantidad para continuar"
        : isLastItem
        ? "Finalizar Auditoría y Cerrar"
        : "Guardar y Continuar";

    return (
        <div className="flex flex-col w-full h-full bg-zinc-50 p-4 sm:p-8 select-none font-sans overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-md mx-auto my-auto flex flex-col">
                {/* Header Compacto de Navegación Contextual */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-zinc-900 tracking-tight">
                        Auditoría de Cierre
                    </span>
                    <span className="text-xs font-semibold text-zinc-400 tabular-nums">
                        {currentIndex + 1} de {auditProducts.length}
                    </span>
                </div>

                {/* Barra Segmentada de Progreso (Bloques discretos) */}
                <div
                    className="grid gap-1.5 mb-6"
                    style={{ gridTemplateColumns: `repeat(${auditProducts.length}, minmax(0, 1fr))` }}
                >
                    {auditProducts.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full ${
                                idx < currentIndex
                                    ? "bg-black"
                                    : idx === currentIndex
                                    ? "bg-black"
                                    : "bg-zinc-200"
                            }`}
                        />
                    ))}
                </div>

                {/* Bloque Central de Producto Protagonista */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 leading-tight">
                        {currentProduct.nombre}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                        {[
                            currentProduct.descripcion,
                            currentProduct.categoria,
                            currentProduct.codigo_interno ? `SKU: ${currentProduct.codigo_interno}` : null
                        ]
                            .filter(Boolean)
                            .join(" • ") || "Producto en catálogo"}
                    </p>
                </div>

                {/* Advertencia de Discrepancia (Segundo Conteo Requerido) */}
                {showWarning && !requiresReason && (
                    <div className="w-full bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl mb-5 flex items-start gap-2.5 text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-extrabold text-xs">La cantidad no coincide con el sistema</p>
                            <p className="text-[11px] text-amber-800/90 mt-0.5">
                                Realiza un segundo conteo físico en estante para verificar.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stepper Táctil + Input Central */}
                <div className="w-full mb-6">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 text-center" htmlFor="countedAmount">
                        Existencia en Estante
                    </label>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleDecrement}
                            disabled={!canDecrement}
                            aria-label="Disminuir cantidad"
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-zinc-200/80 text-zinc-900 hover:bg-zinc-100 active:scale-95 flex items-center justify-center shadow-xs shrink-0 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                            <Minus className="w-6 h-6" />
                        </button>

                        <input
                            id="countedAmount"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoFocus
                            value={countedAmount}
                            onChange={handleAmountChange}
                            placeholder="—"
                            aria-label="Existencia en estante"
                            className="flex-1 min-w-0 h-16 sm:h-18 bg-white border border-zinc-200/80 rounded-full text-center text-4xl sm:text-5xl font-black text-zinc-950 placeholder:text-zinc-300 tabular-nums shadow-xs focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
                        />

                        <button
                            type="button"
                            onClick={handleIncrement}
                            aria-label="Aumentar cantidad"
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-zinc-200/80 text-zinc-900 hover:bg-zinc-100 active:scale-95 flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Discrepancia Confirmada (Formulario de Justificación Refinado) */}
                {requiresReason && (
                    <div className="w-full space-y-3 p-4 bg-red-50/50 rounded-3xl border border-red-200/80 text-left mb-5">
                        <div className="flex items-center gap-2 text-red-700 font-extrabold text-xs sm:text-sm">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Discrepancia Confirmada</span>
                        </div>
                        <p className="text-[11px] text-red-600/90 leading-relaxed">
                            La diferencia persiste. Justifica el ajuste para los registros de auditoría.
                        </p>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                                Motivo del Ajuste *
                            </label>
                            <select
                                value={selectedReason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-2xl border border-zinc-200 bg-white shadow-2xs focus:border-zinc-950 focus:ring-2 focus:ring-black/10 outline-none font-semibold text-xs text-zinc-900 cursor-pointer"
                            >
                                <option value="" disabled>Seleccione un motivo...</option>
                                <option value="Error de registro">Error de registro previo</option>
                                <option value="Daño">Mercancía dañada/caducada</option>
                                <option value="Faltante/Robo">Extravío / Robo detectado</option>
                                <option value="Otro">Otro (Especificar en comentarios)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
                                Comentarios Adicionales *
                            </label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                className="w-full p-3 rounded-2xl border border-zinc-200 bg-white shadow-2xs focus:border-zinc-950 focus:ring-2 focus:ring-black/10 outline-none resize-none h-18 text-xs text-zinc-900"
                                placeholder="Escribe el motivo de la diferencia..."
                            />
                        </div>
                    </div>
                )}

                {/* Botón de Acción Adyacente (Cerca del pulgar y arriba del teclado virtual) */}
                <div className="w-full pt-2">
                    <button
                        type="button"
                        onClick={handleButtonClick}
                        disabled={isActionDisabled}
                        className={`w-full h-14 sm:h-15 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none ${
                            isActionDisabled
                                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none"
                                : "bg-black text-white hover:bg-zinc-800 active:scale-[0.99]"
                        }`}
                    >
                        <span>{buttonText}</span>
                        {hasInput && (isLastItem ? <Check className="w-4 h-4 shrink-0" /> : <ArrowRight className="w-4 h-4 shrink-0" />)}
                    </button>
                </div>
            </div>
        </div>
    );
}
