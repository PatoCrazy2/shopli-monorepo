"use client";

import { useState } from "react";
import { resetPin } from "../actions";
import { KeyRound, X, Loader2, Check } from "lucide-react";

export function ResetPinButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isPinValid = /^\d{6}$/.test(pin);

  const handleOpen = () => {
    setPin("");
    setError(null);
    setIsSuccess(false);
    setIsPending(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPinValid || isPending) return;

    setError(null);
    setIsPending(true);

    try {
      const result = await resetPin(userId, pin);

      if (result?.error) {
        setError(result.error);
        setIsPending(false);
      } else {
        setIsSuccess(true);
        setIsPending(false);
        setTimeout(() => {
          setIsOpen(false);
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || "Error al actualizar el PIN");
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
        title="Cambiar PIN de acceso"
      >
        <KeyRound size={13} />
        <span>Cambiar PIN</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border shadow-xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-zinc-900">Cambiar PIN</h3>
                  <p className="text-xs text-muted-foreground">
                    Usuario: <strong className="text-zinc-800">{userName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {isSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm font-semibold">
                <div className="p-1 rounded-full bg-emerald-200 text-emerald-900">
                  <Check size={16} />
                </div>
                <span>¡PIN de 6 dígitos actualizado con éxito!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="new-pin" className="text-xs font-semibold text-zinc-700">
                    Nuevo PIN de Acceso (6 dígitos)
                  </label>
                  <input
                    id="new-pin"
                    type="password"
                    autoFocus
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPin(val);
                    }}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className={`flex h-11 w-full rounded-xl border bg-transparent px-3 py-2 text-center text-xl font-bold tracking-widest ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      pin && pin.length < 6
                        ? "border-amber-400 focus-visible:ring-amber-400"
                        : "border-input"
                    }`}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Debe ser único en la empresa.</span>
                    <span
                      className={
                        pin.length === 6 ? "text-emerald-600 font-semibold" : "text-zinc-500"
                      }
                    >
                      {pin.length}/6 dígitos
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!isPinValid || isPending}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-1.5" size={14} />
                        Guardando...
                      </>
                    ) : (
                      "Guardar PIN"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
