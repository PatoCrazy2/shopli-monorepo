"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";

export interface SubmitButtonProps extends ButtonProps {
  /** Texto por defecto del botón */
  children: React.ReactNode;
  /** Texto durante los primeros segundos de carga (por defecto: "Guardando...") */
  loadingText?: string;
  /** Texto si la conexión tarda más de slowThresholdMs (por defecto: "Conexión inestable, procesando...") */
  slowText?: string;
  /** Milisegundos de espera antes de advertir lentitud de red (por defecto: 4000ms) */
  slowThresholdMs?: number;
  /** Estado de carga explícito (para formularios que usan useTransition en lugar de server action nativo) */
  isPending?: boolean;
}

export function SubmitButton({
  children,
  loadingText = "Guardando...",
  slowText = "Conexión inestable, procesando...",
  slowThresholdMs = 4000,
  isPending: explicitPending = false,
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = formPending || explicitPending;

  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!pending) {
      setIsSlow(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSlow(true);
    }, slowThresholdMs);

    return () => clearTimeout(timer);
  }, [pending, slowThresholdMs]);

  const isDisabled = Boolean(disabled || pending);

  return (
    <Button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      className={cn(
        "relative transition-all duration-150 select-none",
        pending && "cursor-not-allowed opacity-80",
        className
      )}
      {...props}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current opacity-70" aria-hidden="true" />
          <span className="truncate">{isSlow ? slowText : loadingText}</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
