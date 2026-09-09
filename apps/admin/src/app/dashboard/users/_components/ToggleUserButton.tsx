"use client";

import { useState } from "react";
import { toggleUser } from "../actions";
import { Loader2, AlertTriangle, CheckCircle2, UserMinus, UserCheck, X } from "lucide-react";

interface ToggleUserButtonProps {
  userId: string;
  userName: string;
  userRole: string;
  isActive: boolean;
}

export function ToggleUserButton({
  userId,
  userName,
  userRole,
  isActive,
}: ToggleUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  };

  const handleConfirm = async () => {
    setIsPending(true);
    setError(null);

    try {
      const res = await toggleUser(userId, isActive);
      if (res?.error) {
        setError(res.error);
        setIsPending(false);
      } else {
        setIsPending(false);
        setIsOpen(false);
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error inesperado al actualizar el usuario");
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
          isActive
            ? "bg-zinc-100 text-zinc-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
        }`}
      >
        {isActive ? "Desactivar" : "Reactivar"}
      </button>

      {/* Modal de Confirmación Estilo Apple */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 text-left"
            role="dialog"
            aria-modal="true"
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                  }`}
                >
                  {isActive ? (
                    <UserMinus className="w-5 h-5" />
                  ) : (
                    <UserCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {isActive ? "¿Desactivar usuario?" : "¿Reactivar usuario?"}
                  </h3>
                  <p className="text-xs text-zinc-500">{userRole}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensaje Contextual */}
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>
                Estás a punto de {isActive ? "desactivar" : "reactivar"} el acceso de{" "}
                <span className="font-semibold text-zinc-900 dark:text-white">{userName}</span>.
              </p>
              {isActive ? (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Impacto en el sistema:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-500 pl-1">
                    <li>Se ocultará de la lista de usuarios activos para evitar ruido visual.</li>
                    <li>No podrá iniciar sesión en la app de Punto de Venta (POS).</li>
                    <li>Liberará un cupo de usuario en tu suscripción actual.</li>
                    <li>Podrás reactivarlo en cualquier momento desde la pestaña &quot;Inactivos&quot;.</li>
                  </ul>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900 text-xs space-y-1 text-emerald-800 dark:text-emerald-300">
                  <p className="font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Al reactivar:
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    El usuario volverá a la lista activa y podrá acceder al POS utilizando su PIN registrado.
                  </p>
                </div>
              )}
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                  isActive
                    ? "bg-red-600 text-white hover:bg-red-700 active:scale-95"
                    : "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 active:scale-95"
                }`}
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {isActive
                    ? isPending
                      ? "Desactivando..."
                      : "Confirmar Desactivación"
                    : isPending
                      ? "Reactivando..."
                      : "Confirmar Reactivación"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
