"use client";

import { useState, useEffect } from "react";
import { Store, ExternalLink, Copy, Check, X, QrCode } from "lucide-react";
import QRCodeLib from "qrcode";

const POS_URL = "https://shopli-pos.vercel.app";
const WHATSAPP_MESSAGE = `¡Hola! Aquí tienes el acceso al Punto de Venta (POS) de nuestra tienda: ${POS_URL}\n\nRecuerda ingresar con tu correo registrado y tu PIN asignado.`;

export function PosAccessButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generar código QR cuando se abre el modal
  useEffect(() => {
    if (isOpen && !qrDataUrl) {
      QRCodeLib.toDataURL(POS_URL, {
        width: 220,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [isOpen, qrDataUrl]);

  // Manejar cierre con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(POS_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <>
      {/* Botón Trigger con efecto metallic-border-glow del Hero de la Landing */}
      <div className="relative group p-[1px] rounded-xl overflow-hidden transition-all duration-300 shadow-sm shrink-0">
        <div className="absolute -inset-[100%] metallic-border-glow blur-[2px] pointer-events-none transition-opacity duration-300 opacity-90 group-hover:opacity-100" />

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative z-10 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black hover:bg-neutral-900 text-white font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer border border-transparent active:scale-[0.98]"
        >
          <Store className="w-4 h-4 text-neutral-300 group-hover:text-white transition-colors" />
          <span>Acceso a POS</span>
        </button>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 z-10 animate-in zoom-in-95 duration-200">
            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-md shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Terminal Punto de Venta (POS)
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  Comparte o abre la terminal de ventas para tu personal.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* 1. Botón Principal: Acceso Directo de 1 Clic */}
              <div>
                <a
                  href={POS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-zinc-200 transition-all shadow-md active:scale-[0.98]"
                >
                  <span>Abrir Punto de Venta en este dispositivo</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Divisor */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                <span className="bg-white dark:bg-zinc-950 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider shrink-0">
                  O compartir con tu equipo
                </span>
              </div>

              {/* 2. Compartir por WhatsApp */}
              <div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.98]"
                >
                  {/* WhatsApp SVG Icon */}
                  <svg
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12.004 2c-5.523 0-10 4.477-10 10 0 1.767.458 3.489 1.33 5.006L2 22l5.12-1.311A9.957 9.957 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.25a8.21 8.21 0 0 1-4.221-1.164l-.303-.18-3.042.779.812-2.966-.197-.314A8.204 8.204 0 0 1 3.754 12c0-4.549 3.701-8.25 8.25-8.25 4.548 0 8.25 3.701 8.25 8.25 0 4.549-3.702 8.25-8.25 8.25zm4.52-6.177c-.248-.124-1.468-.724-1.696-.807-.228-.083-.394-.124-.56.124-.166.248-.642.807-.787.973-.145.166-.29.186-.538.062-.249-.124-1.049-.387-1.999-1.233-.739-.659-1.238-1.474-1.383-1.722-.145-.248-.015-.382.109-.506.112-.111.248-.29.373-.435.124-.145.166-.248.249-.414.083-.166.041-.311-.021-.435-.062-.124-.56-1.349-.767-1.848-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.311-.228.249-.87 1.077-.87 2.627s1.119 3.041 1.275 3.249c.155.207 2.203 3.364 5.337 4.718.746.322 1.328.515 1.782.659.749.238 1.431.204 1.97.124.601-.09 1.468-.6 1.676-1.18.207-.58.207-1.077.145-1.18-.062-.104-.228-.166-.477-.29z" />
                  </svg>
                  <span>Compartir por WhatsApp</span>
                </a>
              </div>

              {/* 3. Campo con Botón de Copiar */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Enlace directo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={POS_URL}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-mono select-all focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 4. Código QR para Tablets y Celulares */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-lg p-1 border border-zinc-200 shadow-sm flex items-center justify-center shrink-0">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Código QR para POS"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-8 h-8 text-zinc-300 animate-pulse" />
                  )}
                </div>
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white">
                    <QrCode className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Escaneo rápido con cámara</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Apunta con la tablet o celular del mostrador para abrir la app del POS inmediatamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
