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

      // Solicitar explícitamente el stream para forzar el prompt nativo del navegador si aún no se ha concedido
      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          // Liberar el stream de prueba para que html5QrCode tome control exclusivo
          stream.getTracks().forEach((t) => t.stop());
        } catch (mediaErr: any) {
          console.warn("getUserMedia pre-check error:", mediaErr);
          throw mediaErr;
        }
      }

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
      const errStr = String(err?.message || err?.name || err);
      if (
        err?.name === "NotAllowedError" ||
        errStr.includes("NotAllowedError") ||
        errStr.includes("Permission denied")
      ) {
        setError(
          "El navegador tiene bloqueado el acceso a la cámara. Haz clic en el ícono de candado 🔒 o cámara junto a la URL del navegador y cambia el permiso a 'Permitir'."
        );
      } else if (
        err?.name === "NotFoundError" ||
        errStr.includes("NotFoundError") ||
        errStr.includes("DevicesNotFoundError")
      ) {
        setError("No se detectó ninguna cámara disponible en este dispositivo.");
      } else {
        setError(
          "No se pudo acceder a la cámara. Asegúrate de estar usando HTTPS o localhost y que otra aplicación no esté usando la cámara."
        );
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

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between animate-in fade-in duration-200 select-none">
      {/* Barra superior flotante con Botón de Cierre y Título */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <p className="text-[11px] text-zinc-400">Alinea el código de barras o QR dentro del visor</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full text-white backdrop-blur-md border border-white/10 transition-all"
          aria-label="Cerrar escáner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Visor Inmersivo a Pantalla Completa */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        <div
          id={containerId}
          className="!w-full !h-full flex items-center justify-center overflow-hidden [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_video]:!block !border-none !p-0"
        />

        {/* Mira de Escaneo Minimalista Estilo Apple / POS (Esquinas Blancas Limpias + Láser Sutil) */}
        {!error && !isInitializing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[280px] h-[190px] sm:w-[320px] sm:h-[220px] border border-white/20 rounded-2xl relative shadow-[0_0_30px_rgba(0,0,0,0.6)]">
              {/* Esquinas blancas nítidas */}
              <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
              <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
              <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
              <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />

              {/* Línea láser sutil pulsante */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse" />

              <span className="absolute -bottom-8 inset-x-0 text-center text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                EAN-13 • CODE-128 • QR • UPC
              </span>
            </div>
          </div>
        )}

        {/* Estado de carga */}
        {isInitializing && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-white/60" />
            <p className="text-xs font-semibold tracking-wide text-zinc-300">Iniciando cámara...</p>
          </div>
        )}

        {/* Estado de error / Permisos */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/95 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Acceso a la cámara</h4>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">{error}</p>
            </div>
            <button
              type="button"
              onClick={startScanner}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar Permiso</span>
            </button>
          </div>
        )}
      </div>

      {/* Controles de barra inferior inmersiva */}
      <div className="w-full px-6 py-6 flex items-center justify-center bg-gradient-to-t from-black/90 via-black/50 to-transparent gap-4 shrink-0 pb-safe z-20">
        {hasTorch ? (
          <button
            type="button"
            onClick={toggleTorch}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all active:scale-95 shadow-lg ${
              torchOn
                ? "bg-white text-black border-white"
                : "bg-black/60 text-zinc-300 border-white/10 hover:bg-black/80 hover:text-white"
            }`}
          >
            {torchOn ? (
              <Flashlight className="w-4 h-4 text-amber-500" />
            ) : (
              <FlashlightOff className="w-4 h-4" />
            )}
            <span>{torchOn ? "Flash Encendido" : "Encender Flash"}</span>
          </button>
        ) : (
          <div className="text-[11px] text-zinc-500 font-medium">
            Apunta la cámara al código físico
          </div>
        )}
      </div>
    </div>
  );
}
