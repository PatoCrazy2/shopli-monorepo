"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { registerUser } from "./actions";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  suggestEmailDomain,
  checkPasswordRules,
} from "@/lib/validators/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (typeof window !== "undefined") {
    (window as any).onRegisterTurnstileCallback = (token: string) => {
      setTurnstileToken(token);
    };
  }

  const emailSuggestion = suggestEmailDomain(email);
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
        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (loginRes?.error) {
          router.push("/login?registered=true");
        } else {
          router.push("/onboarding");
          router.refresh();
        }
      }
    });
  };

  return (
    <main className="min-h-screen grid items-center justify-center bg-gray-50 selection:bg-black selection:text-white font-sans p-4">
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
            className="mx-auto w-32 h-32"
          />
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mt-0 mb-2">ShopLI</h2>
          <p className="text-sm text-gray-500 mb-6">Crear Cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Nombre Completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50"
              placeholder="admin@shopli.com"
            />
            {emailSuggestion && (
              <p className="mt-1 text-xs text-neutral-600 flex items-center gap-1">
                <span>¿Quisiste decir</span>
                <button
                  type="button"
                  onClick={() => setEmail(emailSuggestion)}
                  className="font-medium underline hover:text-black cursor-pointer"
                >
                  {emailSuggestion}
                </button>
                <span>?</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Mostrar</span>
                  </>
                )}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50"
              placeholder="••••••••"
            />
            {password.length > 0 && (
              <div className="mt-2">
                <PasswordChecklist password={password} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isPending}
              className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50 ${
                passwordsMatch
                  ? "border-emerald-500 bg-emerald-50/20"
                  : passwordsMismatch
                  ? "border-red-400 bg-red-50/20"
                  : "border-gray-200"
              }`}
              placeholder="••••••••"
            />
            {passwordsMatch && (
              <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1 font-medium animate-in fade-in duration-200">
                <Check className="w-3.5 h-3.5 shrink-0" />
                Las contraseñas coinciden
              </p>
            )}
            {passwordsMismatch && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 animate-in fade-in duration-200">
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
            className="w-full py-3 px-4 flex justify-center items-center gap-2 rounded-xl text-white bg-black hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Crear Cuenta"
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-500 font-medium tracking-wider">o</span>
          </div>
        </div>

        <GoogleSignInButton callbackUrl="/onboarding" label="Continuar con Google" />

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </main>
  );
}

