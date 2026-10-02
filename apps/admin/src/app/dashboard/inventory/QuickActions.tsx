"use client";

import { useState, useTransition } from "react";
import { Plus, Minus, ArrowLeftRight, X, Loader2 } from "lucide-react";
import {
  adjustStock,
  transferStock,
  STOCK_IN_REASONS,
  STOCK_OUT_REASONS,
  type StockInReason,
  type StockOutReason,
} from "./actions";

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
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
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
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} (Stock actual: {getBranchStock(b.id)} u.)
                    </option>
                  ))}
                </select>
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
                <select
                  value={inReason}
                  onChange={(e) => setInReason(e.target.value as StockInReason)}
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  {STOCK_IN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r === "COMPRA" && "Compra (Reabastecimiento de Proveedor)"}
                      {r === "DEVOLUCION" && "Devolución de Cliente"}
                      {r === "AJUSTE_POSITIVO" && "Ajuste Positivo (Sobrante físico)"}
                    </option>
                  ))}
                </select>
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

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
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
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
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
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} (Stock actual: {getBranchStock(b.id)} u.)
                    </option>
                  ))}
                </select>
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
                <select
                  value={outReason}
                  onChange={(e) => setOutReason(e.target.value as StockOutReason)}
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  {STOCK_OUT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r === "MERMA" && "Merma / Caducidad"}
                      {r === "DANO" && "Daño / Defectuoso"}
                      {r === "ROBO" && "Robo / Faltante no justificado"}
                      {r === "CONSUMO_INTERNO" && "Consumo Interno del Negocio"}
                      {r === "AJUSTE_NEGATIVO" && "Ajuste Negativo (Conteo físico)"}
                    </option>
                  ))}
                </select>
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

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
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
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
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
                <select
                  value={targetBranchId}
                  onChange={(e) => {
                    const newOrigin = e.target.value;
                    setTargetBranchId(newOrigin);
                    if (destBranchId === newOrigin) {
                      setDestBranchId(branches.find((b) => b.id !== newOrigin)?.id || "");
                    }
                  }}
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} (Disponible: {getBranchStock(b.id)} u.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Sucursal Destino */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Sucursal Destino (A dónde llega)
                </label>
                <select
                  value={destBranchId}
                  onChange={(e) => setDestBranchId(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  {branches
                    .filter((b) => b.id !== targetBranchId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre} (Stock actual: {getBranchStock(b.id)} u.)
                      </option>
                    ))}
                </select>
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

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
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
