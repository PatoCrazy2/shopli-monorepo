"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Store, MapPin, ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { completeOnboarding } from "./actions";

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState("");
  const [branchName, setBranchName] = useState("Matriz");
  const [branchAddress, setBranchAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!businessName.trim() || businessName.trim().length < 2) {
        setError("Ingresa el nombre de tu negocio (mínimo 2 caracteres).");
        return;
      }
      setStep(2);
    } else {
      if (!branchName.trim() || branchName.trim().length < 2) {
        setError("Nombra tu primera sucursal (mínimo 2 caracteres).");
        return;
      }

      const formData = new FormData();
      formData.append("businessName", businessName);
      formData.append("branchName", branchName);
      if (branchAddress.trim()) {
        formData.append("branchAddress", branchAddress);
      }

      startTransition(async () => {
        const result = await completeOnboarding(formData);

        if (result?.error) {
          setError(result.error);
        } else {
          // Redirigir directamente a la página principal del dashboard
          router.push("/dashboard/inicio");
          router.refresh();
        }
      });
    }
  };

  return (
    <main className="min-h-screen grid items-center justify-center bg-gray-50 selection:bg-black selection:text-white font-sans p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-gray-100 transition-shadow duration-300 hover:shadow-xl relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-black via-gray-700 to-black"></div>

        {/* Header con Logo */}
        <div className="text-center">
          <img
            src="/shopli_snbg.svg"
            alt="Logo"
            className="mx-auto w-24 h-24"
          />
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mt-1 mb-1">
            {step === 1 ? "Configura tu Negocio" : "Tu Primera Sucursal"}
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Paso {step} de 2 &bull; {step === 1 ? "Identidad de la tienda" : "Punto de venta principal"}
          </p>
        </div>

        {/* Barra de progreso Apple Clean */}
        <div className="flex gap-2 mb-6">
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              step >= 1 ? "bg-black" : "bg-gray-200"
            }`}
          ></div>
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              step >= 2 ? "bg-black" : "bg-gray-200"
            }`}
          ></div>
        </div>

        <form onSubmit={handleNextStep} className="space-y-4">
          {step === 1 ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="businessName"
                >
                  ¿Cómo se llama tu tienda o negocio?
                </label>
                <div className="relative">
                  <input
                    id="businessName"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    autoFocus
                    disabled={isPending}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50 text-sm"
                    placeholder="Ej. Abarrotes El Trébol"
                  />
                  <Store className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  Este nombre aparecerá en tus tickets de venta y reportes.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="branchName"
                >
                  Nombra tu primera sucursal
                </label>
                <div className="relative">
                  <input
                    id="branchName"
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    required
                    autoFocus
                    disabled={isPending}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50 text-sm"
                    placeholder="Matriz"
                  />
                  <MapPin className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  Puedes dejar &quot;Matriz&quot;, &quot;Sucursal Centro&quot; o el nombre que prefieras.
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="branchAddress"
                >
                  Dirección (Opcional)
                </label>
                <input
                  id="branchAddress"
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  disabled={isPending}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50 text-sm"
                  placeholder="Av. Principal #123, Col. Centro"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                disabled={isPending}
                className="py-3 px-4 flex items-center justify-center gap-1 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 font-medium text-sm disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 px-4 flex justify-center items-center gap-2 rounded-xl text-white bg-black hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : step === 1 ? (
                <>
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Finalizar y Entrar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
