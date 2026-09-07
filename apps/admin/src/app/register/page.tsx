"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { registerUser } from "./actions";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import {
  suggestEmailDomain,
  isDisposableEmail,
  checkPasswordRules,
} from "@/lib/validators/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Registrar callback global de Turnstile
  if (typeof window !== "undefined") {
    (window as any).onRegisterTurnstileCallback = (token: string) => {
      setTurnstileToken(token);
    };
  }

  // Comprobaciones reactivas en UI
  const emailSuggestion = suggestEmailDomain(email);
  const emailIsDisposable = isDisposableEmail(email);
  const passwordRules = checkPasswordRules(password);
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (emailIsDisposable) {
      setError(
        "Por favor utiliza un correo corporativo o personal válido (no desechable)."
      );
      return;
    }

    if (!passwordRules.isValid) {
      setError(
        "La contraseña debe cumplir con todos los requisitos mínimos (8 caracteres, 1 número y 1 letra)."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    if (turnstileToken) {
      formData.append("turnstileToken", turnstileToken);
    }

    startTransition(async () => {
      const result = await registerUser(formData);

      if (result?.error) {
        setError(result.error);
      } else {
        // Auto-login con credenciales y redirección fluida al asistente de onboarding
        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (loginRes?.error) {
          // Si el auto-login fallara inesperadamente, enviamos a login con feedback
          router.push("/login?registered=true");
        } else {
          router.push("/onboarding");
          router.refresh();
        }
      }
    });
  };

  return (
    <main className="min-h-screen grid items-center justify-center bg-gray-50 selection:bg-black selection:text-white font-sans p-4 py-8">
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      )}
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-gray-100 transition-shadow duration-300 hover:shadow-xl relative overflow-hidden">
        {/* Decorative premium accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-black via-gray-700 to-black"></div>

        <div className="text-center">
          <img
            src="/shopli_snbg.svg"
            alt="Logo"
            className="mx-auto w-24 h-24"
          />
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mt-1 mb-1">
            Crea tu cuenta en ShopLI
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Comienza gratis. Configura tu tienda en menos de un minuto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              htmlFor="name"
            >
              Tu Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              htmlFor="email"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
              className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50 ${
                emailIsDisposable
                  ? "border-red-400 bg-red-50/30"
                  : "border-gray-200"
              }`}
              placeholder="juan@ejemplo.com"
            />
            {emailSuggestion && (
              <p className="mt-1 text-xs text-amber-700 flex items-center gap-1">
                <span>¿Quisiste escribir</span>
                <button
                  type="button"
                  onClick={() => setEmail(emailSuggestion)}
                  className="font-semibold underline hover:text-black cursor-pointer"
                >
                  {emailSuggestion}
                </button>
                <span>?</span>
              </p>
            )}
            {emailIsDisposable && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                No se permiten correos temporales o desechables.
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50"
                placeholder="Crea una contraseña segura"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {password.length > 0 && <PasswordChecklist password={password} />}
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              htmlFor="confirmPassword"
            >
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isPending}
                className={`w-full px-4 py-2.5 pr-11 rounded-xl border bg-gray-50 text-gray-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50 ${
                  passwordsMatch
                    ? "border-emerald-500 bg-emerald-50/20"
                    : passwordsMismatch
                    ? "border-red-400 bg-red-50/20"
                    : "border-gray-200"
                }`}
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                title={
                  showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordsMatch && (
              <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1 font-medium animate-in fade-in duration-200">
                <Check className="w-3.5 h-3.5 shrink-0" />
                Las contraseñas coinciden
              </p>
            )}
            {passwordsMismatch && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          {siteKey && (
            <div className="flex justify-center my-2">
              <div
                className="cf-turnstile"
                data-sitekey={siteKey}
                data-callback="onRegisterTurnstileCallback"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !passwordRules.isValid || !passwordsMatch}
            className="w-full py-3 px-4 mt-2 flex justify-center items-center gap-2 rounded-xl text-white bg-black hover:bg-neutral-800 focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            ) : (
              "Crear Cuenta"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-xs font-medium text-gray-500 hover:text-black transition-colors"
          >
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </main>
  );
}

