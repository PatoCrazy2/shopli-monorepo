"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitContactMessage } from "@/actions/contact";

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: string;
}

export function ContactDialog({ isOpen, onClose, defaultPlan }: ContactDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    mensaje: defaultPlan
      ? `Hola, me interesa conocer más detalles sobre el plan ${defaultPlan} y soluciones para mi negocio.`
      : "",
  });

  // Si cambia el plan predeterminado al abrir
  useEffect(() => {
    if (defaultPlan) {
      setFormData((prev) => ({
        ...prev,
        mensaje: `Hola, me interesa conocer más detalles sobre el plan ${defaultPlan} y soluciones para mi negocio.`,
      }));
    }
  }, [defaultPlan]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await submitContactMessage(formData);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Ocurrió un error al enviar tu mensaje.");
      }
    });
  };

  const handleReset = () => {
    setStatus("idle");
    setErrorMessage(null);
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      mensaje: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop con desenfoque de lujo */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isPending) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl bg-[#09090d]/95 border border-white/[0.12] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-dialog-title"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {status === "success" ? (
          /* Estado de Éxito */
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              ¡Mensaje enviado con éxito!
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mb-6 leading-relaxed">
              Hemos registrado tu solicitud en nuestro sistema. Un asesor revisará tus requerimientos y te responderá a la brevedad.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="py-3 px-6 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          /* Formulario */
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
                Contacto Directo
              </span>
              <h3 id="contact-dialog-title" className="text-xl sm:text-2xl font-bold text-white">
                Cuéntanos sobre tu negocio
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Recibe una propuesta adaptada a tu número de sucursales y volumen operativo.
              </p>
            </div>

            {status === "error" && errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nombre completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isPending}
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. Roberto Sánchez"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-white/30 focus:ring-1 focus:ring-white/20 text-white placeholder-neutral-500 text-xs transition-colors outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Correo electrónico <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isPending}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tucorreo@empresa.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-white/30 focus:ring-1 focus:ring-white/20 text-white placeholder-neutral-500 text-xs transition-colors outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    WhatsApp o Teléfono <span className="text-neutral-500 text-[10px]">(Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    disabled={isPending}
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-white/30 focus:ring-1 focus:ring-white/20 text-white placeholder-neutral-500 text-xs transition-colors outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  ¿En qué podemos ayudarte? <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  disabled={isPending}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Detalles sobre tu negocio, dudas o personalizaciones que requieres..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] focus:border-white/30 focus:ring-1 focus:ring-white/20 text-white placeholder-neutral-500 text-xs transition-colors outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 px-5 rounded-2xl bg-white text-black font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(255,255,255,0.1)] active:scale-[0.99]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando mensaje...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar mensaje</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-center text-neutral-500 pt-1">
                Tus datos están protegidos y nunca serán compartidos con terceros.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
