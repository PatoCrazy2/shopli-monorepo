"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "../actions";
import Link from "next/link";

export default function NewUserPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [numeroTel, setNumeroTel] = useState("");
  const [role, setRole] = useState("CAJERO");
  const [pin, setPin] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isPinValid = /^\d{6}$/.test(pin);
  const isEmailValid = emailRegex.test(email);
  const isNameValid = name.trim().length > 0;
  const isRoleValid = role === "ENCARGADO" || role === "CAJERO";

  const isFormValid = isNameValid && isEmailValid && isRoleValid && isPinValid;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid || isPending) return;

    setError(null);
    setIsPending(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    if (numeroTel.trim()) {
      formData.append("numero_tel", numeroTel.trim());
    }
    formData.append("role", role);
    formData.append("pin", pin);

    try {
      const result = await createUser(formData);

      if (result?.error) {
        setError(result.error);
        setIsPending(false);
      } else {
        router.push("/dashboard/users");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Error al crear el usuario");
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
        <p className="text-muted-foreground mt-2">
          Agrega un nuevo cajero o encargado de sucursal.
        </p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none text-zinc-800">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none text-zinc-800">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  email && !isEmailValid ? "border-red-400 focus-visible:ring-red-400" : "border-input"
                }`}
                placeholder="juan@ejemplo.com"
              />
              {email && !isEmailValid && (
                <p className="text-xs text-red-500 font-medium">Ingresa un correo electrónico válido.</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="numero_tel" className="text-sm font-medium leading-none text-zinc-800">
                Teléfono (Opcional)
              </label>
              <input
                id="numero_tel"
                name="numero_tel"
                type="tel"
                value={numeroTel}
                onChange={(e) => setNumeroTel(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Ej. 5512345678"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium leading-none text-zinc-800">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="ENCARGADO">Encargado</option>
                <option value="CAJERO">Cajero</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium leading-none text-zinc-800">
                PIN de Acceso (6 dígitos) <span className="text-red-500">*</span>
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(val);
                }}
                required
                maxLength={6}
                minLength={6}
                pattern="\d{6}"
                className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  pin && pin.length < 6 ? "border-amber-400 focus-visible:ring-amber-400" : "border-input"
                }`}
                placeholder="123456"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Debe ser un número de 6 dígitos.</span>
                <span className={pin.length === 6 ? "text-emerald-600 font-semibold" : "text-zinc-500"}>
                  {pin.length}/6 dígitos
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-4 border-t">
            <Link
              href="/dashboard/users"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-900 h-10 py-2 px-4"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ring-offset-background bg-zinc-900 text-white hover:bg-zinc-900/90 h-10 py-2 px-4 shadow-sm"
            >
              {isPending ? "Guardando..." : "Guardar Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
