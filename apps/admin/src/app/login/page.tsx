"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false, // Manejamos la redirección manualmente
            });

            if (result?.error) {
                // NextAuth v5 credentials expone "CredentialsSignin" para fallos precisos
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
        <main className="min-h-screen grid items-center justify-center bg-gray-50 selection:bg-black selection:text-white font-sans p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-gray-100 transition-shadow duration-300 hover:shadow-xl relative overflow-hidden">
                {/* Decorative premium accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-black via-gray-700 to-black"></div>

                <div className="text-center">
                    <img
                        src="/shopli_snbg.svg"
                        alt="Logo"
                        className="mx-auto  w-32 h-32"
                    />
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 mt-0 mb-2">ShopLI</h2>
                    <p className="text-sm text-gray-500 mb-4">Iniciar Sesión</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isPending}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 disabled:opacity-50"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-in fade-in duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 px-4 flex justify-center items-center gap-2 rounded-xl text-white bg-black hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            "Iniciar Sesión"
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
