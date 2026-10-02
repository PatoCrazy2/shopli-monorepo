"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Plus, Minus, ArrowLeftRight, X, Loader2, ChevronDown, Check } from "lucide-react";
import {
  adjustStock,
  transferStock,
} from "./actions";
import {
  STOCK_IN_REASONS,
  STOCK_OUT_REASONS,
  type StockInReason,
  type StockOutReason,
} from "./constants";

interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona una opción...",
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors flex items-center justify-between gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-zinc-900 dark:text-zinc-100" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 py-1 max-h-48 overflow-y-auto"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors text-left cursor-pointer ${
                  isSelected
                    ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <div className="truncate pr-2">
                  <div className="truncate">{opt.label}</div>
                  {opt.sublabel && (
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-normal">
                      {opt.sublabel}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface QuickActionsProps {
  productId: string;
  productName: string;
  branches: { id: string; nombre: string }[];
  selectedBranchId?: string;
  productShares: { sucursal_id: string; cantidad: number }[];
}

export function QuickActions({
  productId,
  productName,
  branches,
  selectedBranchId,
  productShares,
}: QuickActionsProps) {
  const [modalType, setModalType] = useState<"IN" | "OUT" | "TRANSFER" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const defaultBranch =
    selectedBranchId || (branches.length > 0 ? branches[0].id : "");
  const [targetBranchId, setTargetBranchId] = useState(defaultBranch);
  const [destBranchId, setDestBranchId] = useState(
    branches.find((b) => b.id !== defaultBranch)?.id || ""
  );
  const [amountStr, setAmountStr] = useState("");
  const [inReason, setInReason] = useState<StockInReason>("COMPRA");
  const [outReason, setOutReason] = useState<StockOutReason>("AJUSTE_NEGATIVO");
  const [notes, setNotes] = useState("");

  const closeModal = () => {
    setModalType(null);
    setAmountStr("");
    setNotes("");
    setErrorMsg(null);
  };

  const getBranchStock = (branchId: string) => {
    return productShares.find((s) => s.sucursal_id === branchId)?.cantidad ?? 0;
  };

  const currentStock = getBranchStock(targetBranchId);

  // Handle Ingress [+]
  const handleIngress = () => {
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Ingresa una cantidad válida mayor a 0.");
      return;
    }
    if (!targetBranchId) {
      setErrorMsg("Selecciona una sucursal.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await adjustStock({
        productId,
        amount,
        operation: "IN",
        reason: inReason,
        sucursalId: targetBranchId,
        notes: notes.trim() || undefined,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        closeModal();
      }
    });
  };

  // Handle Egress [-]
  const handleEgress = () => {
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Ingresa una cantidad válida mayor a 0.");
      return;
    }
    if (!targetBranchId) {
      setErrorMsg("Selecciona una sucursal.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await adjustStock({
        productId,
        amount,
        operation: "OUT",
        reason: outReason,
        sucursalId: targetBranchId,
        notes: notes.trim() || undefined,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        closeModal();
      }
    });
  };

  // Handle Transfer [⇄]
  const handleTransfer = () => {
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Ingresa una cantidad válida mayor a 0.");
      return;
    }
    if (!targetBranchId || !destBranchId) {
      setErrorMsg("Selecciona sucursal de origen y destino.");
      return;
    }
    if (targetBranchId === destBranchId) {
      setErrorMsg("La sucursal de origen y destino deben ser distintas.");
      return;
    }
    if (amount > currentStock) {
      setErrorMsg(`Stock insuficiente en origen (${currentStock} disponibles).`);
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await transferStock({
        type: "TRANSFER",
        productId,
        amount,
        fromBranchId: targetBranchId,
        toBranchId: destBranchId,
        reason: notes.trim() || "Transferencia rápida entre sucursales",
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        closeModal();
      }
    });
  };

  const hasMultipleBranches = branches.length > 1;

  return (
    <>
      {/* Botones de Acción Rápida (Solo Íconos) */}
      <div
        className="inline-flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            setTargetBranchId(defaultBranch);
            setModalType("IN");
          }}
          title="Ingreso de Stock (+)"
          aria-label="Registrar ingreso de stock"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            setTargetBranchId(defaultBranch);
            setModalType("OUT");
          }}
          title="Salida de Stock (-)"
          aria-label="Registrar salida de stock"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs active:scale-95"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={!hasMultipleBranches}
          onClick={() => {
            setTargetBranchId(defaultBranch);
            setDestBranchId(branches.find((b) => b.id !== defaultBranch)?.id || "");
            setModalType("TRANSFER");
          }}
          title={
            hasMultipleBranches
              ? "Transferencia entre sucursales (⇄)"
              : "Se requieren al menos 2 sucursales para transferir"
          }
          aria-label="Transferir stock entre sucursales"
          className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors shadow-2xs active:scale-95 ${
            hasMultipleBranches
              ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              : "border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal de Ingreso [+] */}
      {modalType === "IN" && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Ingreso de Stock
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate max-w-[260px]">
                    {productName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Sucursal */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Sucursal Destino
                </label>
                <CustomSelect
                  value={targetBranchId}
                  onChange={setTargetBranchId}
                  options={branches.map((b) => ({
                    value: b.id,
                    label: b.nombre,
                    sublabel: `Stock actual: ${getBranchStock(b.id)} u.`,
                  }))}
                />
              </div>

              {/* Cantidad */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                    Cantidad a Ingresar
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Actual:{" "}
                    <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-700 dark:text-zinc-300">
                      {currentStock}
                    </span>{" "}
                    u.
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="Ej. 10"
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono tabular-nums tracking-tight font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {/* Motivo Estandarizado */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Motivo de Ingreso
                </label>
                <CustomSelect
                  value={inReason}
                  onChange={(val) => setInReason(val as StockInReason)}
                  options={[
                    { value: "COMPRA", label: "Compra (Reabastecimiento de Proveedor)" },
                    { value: "DEVOLUCION", label: "Devolución de Cliente" },
                    { value: "AJUSTE_POSITIVO", label: "Ajuste Positivo (Sobrante físico)" },
                  ]}
                />
              </div>

              {/* Nota Opcional */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Referencia / Nota <span className="text-zinc-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Factura #402, lote de reposición..."
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleIngress}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Registrar Ingreso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Salida [-] */}
      {modalType === "OUT" && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
                  <Minus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Salida de Stock
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate max-w-[260px]">
                    {productName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Sucursal */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Sucursal Origen
                </label>
                <CustomSelect
                  value={targetBranchId}
                  onChange={setTargetBranchId}
                  options={branches.map((b) => ({
                    value: b.id,
                    label: b.nombre,
                    sublabel: `Stock actual: ${getBranchStock(b.id)} u.`,
                  }))}
                />
              </div>

              {/* Cantidad */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                    Cantidad a Descontar
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Disponible:{" "}
                    <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-700 dark:text-zinc-300">
                      {currentStock}
                    </span>{" "}
                    u.
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="Ej. 5"
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono tabular-nums tracking-tight font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {/* Motivo Estandarizado */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Motivo de Salida
                </label>
                <CustomSelect
                  value={outReason}
                  onChange={(val) => setOutReason(val as StockOutReason)}
                  options={[
                    { value: "MERMA", label: "Merma / Caducidad" },
                    { value: "DANO", label: "Daño / Defectuoso" },
                    { value: "ROBO", label: "Robo / Faltante no justificado" },
                    { value: "CONSUMO_INTERNO", label: "Consumo Interno del Negocio" },
                    { value: "AJUSTE_NEGATIVO", label: "Ajuste Negativo (Conteo físico)" },
                  ]}
                />
              </div>

              {/* Nota Opcional */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Detalle / Nota <span className="text-zinc-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Empaque roto durante descarga..."
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEgress}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Registrar Salida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferencia [⇄] */}
      {modalType === "TRANSFER" && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Transferencia de Stock
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate max-w-[260px]">
                    {productName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Sucursal Origen */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Sucursal Origen (De dónde sale)
                </label>
                <CustomSelect
                  value={targetBranchId}
                  onChange={(newOrigin) => {
                    setTargetBranchId(newOrigin);
                    if (destBranchId === newOrigin) {
                      setDestBranchId(branches.find((b) => b.id !== newOrigin)?.id || "");
                    }
                  }}
                  options={branches.map((b) => ({
                    value: b.id,
                    label: b.nombre,
                    sublabel: `Disponible: ${getBranchStock(b.id)} u.`,
                  }))}
                />
              </div>

              {/* Sucursal Destino */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Sucursal Destino (A dónde llega)
                </label>
                <CustomSelect
                  value={destBranchId}
                  onChange={setDestBranchId}
                  options={branches
                    .filter((b) => b.id !== targetBranchId)
                    .map((b) => ({
                      value: b.id,
                      label: b.nombre,
                      sublabel: `Stock actual: ${getBranchStock(b.id)} u.`,
                    }))}
                />
              </div>

              {/* Cantidad */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                    Cantidad a Transferir
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Disponible en origen:{" "}
                    <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-700 dark:text-zinc-300">
                      {currentStock}
                    </span>{" "}
                    u.
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={currentStock > 0 ? currentStock : undefined}
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="Ej. 10"
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono tabular-nums tracking-tight font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {/* Motivo / Nota */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Motivo o Folio de Traspaso <span className="text-zinc-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Envío en camioneta 1, traspaso por rotación..."
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Completar Transferencia
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
