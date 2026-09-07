"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react";
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
        setError("Nombra tu sucursal principal (mínimo 2 caracteres).");
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
          // Recarga completa para que el middleware/layout emita la cookie de sesión con el nuevo empresa_id
          window.location.href = "/dashboard/inicio";
        }
      });
    }
  };

  return (
    <main className="min-h-screen grid items-center justify-center bg-gray-50/70 selection:bg-black selection:text-white font-sans p-4 sm:p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl p-8 sm:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-black via-gray-700 to-black"></div>

        {/* Encabezado con Identidad ShopLI */}
        <div className="text-center mb-8">
          <img
            src="/shopli_snbg.svg"
            alt="ShopLI Logo"
            className="mx-auto w-24 h-24 mb-1"
          />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-2">
            {step === 1 ? "Configuración de tu Negocio" : "Sucursal Principal"}
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {step === 1
              ? "Define la identidad comercial con la que operarás en la plataforma."
              : "Establece el punto de venta o sucursal donde comenzarás operaciones."}
          </p>
        </div>

        {/* Indicador de Pasos Tipo Setup Wizard */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-medium text-gray-400 mb-2">
            <span className={step >= 1 ? "text-black font-semibold" : ""}>
              1. Identidad comercial
            </span>
            <span className={step === 2 ? "text-black font-semibold" : ""}>
              2. Punto operativo
            </span>
          </div>
          <div className="flex gap-2">
            <div
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                step >= 1 ? "bg-black" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                step >= 2 ? "bg-black" : "bg-gray-200"
              }`}
            ></div>
          </div>
        </div>

        <form onSubmit={handleNextStep} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label
                  className="block text-sm font-medium text-gray-800 mb-1.5"
                  htmlFor="businessName"
                >
                  Nombre de tu negocio o empresa
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
                    placeholder="Ej. Distrito Café, Lumina Concept, Grupo Ámbar"
                  />
                  <Building2 className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Este nombre figurará en tus comprobantes, reportes y cotizaciones.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label
                  className="block text-sm font-medium text-gray-800 mb-1.5"
                  htmlFor="branchName"
                >
                  Nombre de la sucursal
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
                    placeholder="Matriz o Sucursal Centro"
                  />
                  <MapPin className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Podrás agregar y gestionar múltiples sucursales más adelante desde el dashboard.
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-800 mb-1.5"
                  htmlFor="branchAddress"
                >
                  Ubicación física o dirección (opcional)
                </label>
                <input
                  id="branchAddress"
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  disabled={isPending}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50 text-sm"
                  placeholder="Av. Paseo de la Reforma 222, CDMX"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2.5 animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-3 flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                disabled={isPending}
                className="py-3 px-5 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-black transition-all duration-200 font-medium text-sm disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 px-5 flex justify-center items-center gap-2 rounded-xl text-white bg-black hover:bg-neutral-800 focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                  <span>Comenzar a operar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

