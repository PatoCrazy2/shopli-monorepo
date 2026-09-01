import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../../../lib/db";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (id: string) => void;
}

interface ToastMessage {
  id: number;
  nombre: string;
  precio: number;
  type: 'success' | 'error';
}

export default function CameraScannerModal({ isOpen, onClose, onAddToCart }: CameraScannerModalProps) {
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const lastReadCodeRef = useRef<{ code: string; time: number } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generar un beep corto a 1kHz usando Web Audio API nativa
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1kHz
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime); // volumen moderado

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1); // beep de 100ms
    } catch (e) {
      console.warn("Web Audio API no soportada o bloqueada por permisos:", e);
    }
  };

  // Sonido de error grave
  const playErrorBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime); // 300Hz
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.25); // beep largo de 250ms
    } catch (e) {
      console.warn("AudioContext error:", e);
    }
  };

  // Feedback de vibración háptica
  const triggerVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Reiniciar estados al abrir
    setScannerError(null);
    setIsTorchOn(false);

    // Asegurar que el contenedor está montado antes de instanciar Html5Qrcode
    const timer = setTimeout(() => {
      const html5Qrcode = new Html5Qrcode("qr-reader");
      html5QrcodeRef.current = html5Qrcode;

      html5Qrcode
        .start(
          { facingMode: "environment" },
          {
            fps: 15,
            videoConstraints: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          },
          async (decodedText) => {
            const now = Date.now();
            // Cooldown de 1.5s para la misma lectura consecutiva
            if (
              lastReadCodeRef.current &&
              lastReadCodeRef.current.code === decodedText &&
              now - lastReadCodeRef.current.time < 1500
            ) {
              return;
            }
            lastReadCodeRef.current = { code: decodedText, time: now };

            console.log("[CameraScanner] Código decodificado de cámara:", decodedText);

            try {
              // Buscar producto en Dexie
              const matchedProduct = await db.products
                .where("codigo_interno")
                .equalsIgnoreCase(decodedText)
                .first();

              if (matchedProduct) {
                // Agregar al carrito
                onAddToCart(matchedProduct.id);

                // Feedback sonoro y háptico
                playBeep();
                triggerVibration();

                // Mostrar toast visual flotante de 1.2s sin pausar el escaneo
                if (toastTimeoutRef.current) {
                  clearTimeout(toastTimeoutRef.current);
                }
                setToast({
                  id: now,
                  nombre: matchedProduct.nombre,
                  precio: matchedProduct.precio_publico,
                  type: 'success',
                });
                toastTimeoutRef.current = setTimeout(() => {
                  setToast(null);
                }, 1200);
              } else {
                console.warn(`[CameraScanner] Código leído pero no encontrado en IndexedDB: ${decodedText}`);
                playErrorBeep();
                
                if (toastTimeoutRef.current) {
                  clearTimeout(toastTimeoutRef.current);
                }
                setToast({
                  id: now,
                  nombre: `No registrado: ${decodedText}`,
                  precio: 0,
                  type: 'error',
                });
                toastTimeoutRef.current = setTimeout(() => {
                  setToast(null);
                }, 1800);
              }
            } catch (err) {
              console.error("Error al buscar código en la base local:", err);
            }
          },
          () => {
            // Ignoramos la mayoría de los errores por frame no detectado (html5-qrcode es muy ruidosa)
          }
        )
        .catch((err) => {
          console.error("Error iniciando html5-qrcode:", err);
          setScannerError(
            "No se pudo acceder a la cámara trasera. Por favor, concede los permisos correspondientes."
          );
        });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (html5QrcodeRef.current) {
        const scanner = html5QrcodeRef.current;
        if (scanner.isScanning) {
          scanner
            .stop()
            .then(() => {
              console.log("Scanner detenido correctamente.");
            })
            .catch((err) => {
              console.error("Error deteniendo el scanner:", err);
            });
        }
      }
    };
  }, [isOpen, onAddToCart]);

  const toggleTorch = async () => {
    if (!html5QrcodeRef.current) return;
    try {
      const nextTorch = !isTorchOn;
      await html5QrcodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.error("Error toggling torch:", err);
      alert("La linterna no es compatible con la cámara actual o este navegador.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
      
      {/* Floating Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-none"
        aria-label="Cerrar escáner"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Visor Area */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        {scannerError ? (
          <div className="px-6 text-center text-xs text-red-400 max-w-xs leading-relaxed">
            {scannerError}
          </div>
        ) : (
          <div id="qr-reader" className="!w-full !h-full flex items-center justify-center overflow-hidden [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_video]:!block !border-none !p-0" />
        )}

        {/* Minimalist targeting square frame (aligned to exactly 260px) */}
        {!scannerError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[260px] h-[260px] border border-white/20 rounded-2xl relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              {/* Clean white corners */}
              <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
              <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
              <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
              <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
              
              {/* Sutil scanning line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse mt-4" />
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toast && (
          <div className={`absolute bottom-6 left-4 right-4 border text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-sm ${
            toast.type === 'success'
              ? 'bg-zinc-900/95 border-zinc-800'
              : 'bg-red-950/95 border-red-800/80 text-red-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${
              toast.type === 'success' ? 'text-zinc-400' : 'text-red-400'
            }`}>
              {toast.type === 'success' ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              )}
            </svg>
            <div className="min-w-0 flex-1 truncate">
              {toast.nombre}
            </div>
            {toast.type === 'success' && (
              <div className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-[10px] shrink-0 text-zinc-300">
                ${toast.precio.toFixed(2)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="w-full px-6 py-6 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md border-t border-zinc-900 gap-4 shrink-0 pb-safe">
        <button
          onClick={toggleTorch}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-none ${
            isTorchOn
              ? "bg-white text-black shadow-sm"
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <line x1="9" y1="18" x2="15" y2="18" />
            <line x1="10" y1="22" x2="14" y2="22" />
          </svg>
          <span>{isTorchOn ? "Flash Encendido" : "Encender Flash"}</span>
        </button>
      </div>
    </div>
  );
}
