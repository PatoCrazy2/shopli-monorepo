"use client";

import { useState, useTransition, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                if (result.error === "CredentialsSignin") {
                    setError("Credenciales inválidas. Por favor verifique sus datos.");
                } else {
                    setError("Ocurrió un error inesperado al iniciar sesión.");
                }
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        });
    };

    return (
        <main className="relative min-h-screen w-full flex flex-col justify-between items-center bg-[#09090b] text-neutral-100 font-sans selection:bg-white selection:text-black overflow-x-hidden p-6 sm:p-8">
            {/* Background Image con overlay sutil y viñeta para integración profunda */}
            <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
                <Image
                    src="/shopli-hero-readme.webp"
                    alt="ShopLI Background"
                    fill
                    priority
                    className="object-cover object-center opacity-40 brightness-75 scale-105"
                />
                {/* Viñeta radial oscura para máxima legibilidad del formulario */}
                <div className="absolute inset-0 bg-radial from-transparent via-[#09090b]/60 to-[#09090b]/95" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/70 via-[#09090b]/30 to-[#09090b]/90" />
            </div>

            {/* Header / Top Navigation Bar */}
            <header className="relative z-10 w-full max-w-7xl flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors duration-200 group py-2"
                >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    <span>Inicio</span>
                </Link>
            </header>

            {/* Contenedor Central del Formulario */}
            <div className="relative z-10 w-full max-w-[390px] my-auto py-8">
                {/* Isotipo / Logo ShopLI */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="mb-4">
                        <Image
                            src="/shopliWhite.svg"
                            alt="ShopLI Logo"
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain filter drop-shadow-[0_2px_12px_rgba(255,255,255,0.12)]"
                            priority
                        />
                    </div>
                    <h1 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-white mb-2">
                        Iniciar sesión en ShopLI
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-400">
                        ¿No tienes una cuenta?{" "}
                        <Link
                            href="/register"
                            className="text-neutral-200 font-medium hover:text-white underline underline-offset-4 decoration-neutral-600 hover:decoration-white transition-colors"
                        >
                            Regístrate
                        </Link>
                    </p>
                </div>

                {/* Banner de Confirmación de Registro */}
                {registered && (
                    <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>¡Empresa registrada con éxito! Ya puedes ingresar con tus credenciales.</span>
                    </div>
                )}

                {/* Autenticación Social (OAuth) */}
                <div className="mb-6">
                    <GoogleSignInButton
                        callbackUrl="/dashboard/inicio"
                        label="Continuar con Google"
                        variant="dark"
                    />
                </div>

                {/* Separador Horizontal Minimalista */}
                <div className="relative my-6 flex items-center justify-center">
                    <div className="w-full border-t border-white/[0.08]"></div>
                    <span className="absolute bg-[#0b0c0e]/80 px-3 text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                        o
                    </span>
                </div>

                {/* Formulario de Credenciales */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo Email */}
                    <div className="space-y-1.5">
                        <label
                            className="block text-xs font-medium text-neutral-300 tracking-wide"
                            htmlFor="email"
                        >
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isPending}
                            placeholder="nombre@empresa.com"
                            className="w-full px-4 py-3 rounded-xl bg-[#141416]/90 border border-white/[0.08] text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 hover:border-white/[0.14] transition-all duration-200 disabled:opacity-50"
                        />
                    </div>

                    {/* Campo Contraseña con Toggle */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label
                                className="block text-xs font-medium text-neutral-300 tracking-wide"
                                htmlFor="password"
                            >
                                Contraseña
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors cursor-pointer"
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
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl bg-[#141416]/90 border border-white/[0.08] text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 hover:border-white/[0.14] transition-all duration-200 disabled:opacity-50"
                        />
                    </div>

                    {/* Alerta de Error */}
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Botón Principal (CTA) */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full mt-2 py-3 px-4 flex justify-center items-center gap-2 rounded-xl text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                    >
                        {isPending ? (
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            "Iniciar sesión"
                        )}
                    </button>
                </form>

                {/* Footer Legal Discreto */}
                <p className="mt-8 text-center text-[11px] leading-relaxed text-neutral-400">
                    Al continuar, aceptas nuestros{" "}
                    <Link href="/terms" className="underline underline-offset-2 text-neutral-300 hover:text-white transition-colors">
                        Términos de servicio
                    </Link>{" "}
                    y{" "}
                    <Link href="/privacy" className="underline underline-offset-2 text-neutral-300 hover:text-white transition-colors">
                        Aviso de privacidad
                    </Link>
                    .
                </p>
            </div>

            {/* Footer Bottom Spacer for Visual Centering */}
            <div className="relative z-10 w-full max-w-7xl h-4" />
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-sans bg-[#09090b] text-neutral-400">Cargando...</div>}>
            <LoginForm />
        </Suspense>
    );
}
