"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Flashlight, FlashlightOff, X, AlertCircle, RefreshCw } from "lucide-react";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

// Función sintetizadora de sonido "beep" con Web Audio API (0 KB de assets)
function playBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Ignorar si el navegador bloquea audio sin interacción previa
  }
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Escanear Código de Barras / QR",
}: BarcodeScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "barcode-scanner-viewport";
  const hasDetectedRef = useRef(false);

  const handleSuccess = useCallback(
    (decodedText: string) => {
      if (hasDetectedRef.current) return;
      hasDetectedRef.current = true;

      // Feedback sonoro y háptico
      playBeep();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100);
      }

      onScan(decodedText.trim());
      onClose();
    },
    [onScan, onClose]
  );

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.error("Error al detener el escáner:", e);
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    hasDetectedRef.current = false;

    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(minEdge * 0.8),
            height: Math.floor(minEdge * 0.5),
          };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => handleSuccess(decodedText),
        () => {
          // Ignorar frames sin código detectado
        }
      );

      // Comprobar si la cámara tiene linterna / torch
      try {
        const capabilities = (html5QrCode as any).getRunningTrackCapabilities?.();
        if (capabilities && "torch" in capabilities) {
          setHasTorch(true);
        }
      } catch (e) {
        // Torch no soportado
      }

      setIsInitializing(false);
    } catch (err: any) {
      console.error("Error iniciando cámara:", err);
      setIsInitializing(false);
      if (err?.name === "NotAllowedError" || String(err).includes("NotAllowedError")) {
        setError("Permiso denegado para acceder a la cámara. Habilítalo en los ajustes del navegador.");
      } else if (err?.name === "NotFoundError" || String(err).includes("NotFoundError")) {
        setError("No se detectó ninguna cámara disponible en este dispositivo.");
      } else {
        setError("No se pudo iniciar la cámara. Verifica que otra app no la esté usando.");
      }
    }
  }, [handleSuccess, stopScanner]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.error("No se pudo cambiar la linterna:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left overflow-hidden relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
              <p className="text-[11px] text-zinc-400">Alinea el código dentro del visor</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={torchOn ? "Apagar linterna" : "Encender linterna"}
              >
                {torchOn ? (
                  <Flashlight className="w-4 h-4 text-amber-500" />
                ) : (
                  <FlashlightOff className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport de Escáner */}
        <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-800">
          <div id={containerId} className="w-full h-full object-cover" />

          {/* Mira animada estilo láser */}
          {!error && !isInitializing && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
              <div className="relative w-full h-48 border-2 border-dashed border-white/60 rounded-xl flex items-center justify-center">
                <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                <span className="absolute bottom-2 text-[10px] uppercase font-bold tracking-widest text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                  Lector Activo
                </span>
              </div>
            </div>
          )}

          {/* Estado de carga */}
          {isInitializing && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 text-white space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
              <p className="text-xs font-medium text-zinc-400">Iniciando cámara...</p>
            </div>
          )}

          {/* Estado de error */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-950 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-950/60 text-red-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-zinc-300 max-w-xs">{error}</p>
              <button
                type="button"
                onClick={startScanner}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span>Formatos: EAN-13, CODE-128, QR, UPC</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-zinc-700 dark:text-zinc-300 hover:underline"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
