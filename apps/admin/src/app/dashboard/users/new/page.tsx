"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "../actions";
import Link from "next/link";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-zinc-900 text-white hover:bg-zinc-900/90 h-10 py-2 px-4 shadow-sm"
    >
      {pending ? "Guardando..." : "Guardar Usuario"}
    </button>
  );
}

export default function NewUserPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const result = await createUser(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard/users");
      router.refresh(); // Aseguramos que la tabla actualice los datos 
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
        <form action={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none text-zinc-800">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                required
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none text-zinc-800">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="juan@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="numero_tel" className="text-sm font-medium leading-none text-zinc-800">
                Teléfono (Opcional)
              </label>
              <input
                id="numero_tel"
                name="numero_tel"
                type="tel"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Ej. 5512345678"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium leading-none text-zinc-800">
                Rol
              </label>
              <select
                id="role"
                name="role"
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                defaultValue="CAJERO"
              >
                <option value="ENCARGADO">Encargado</option>
                <option value="CAJERO">Cajero</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium leading-none text-zinc-800">
                PIN de Acceso (4 dígitos)
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                required
                maxLength={4}
                minLength={4}
                pattern="\d{4}"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="1234"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-4 border-t">
            <Link
              href="/dashboard/users"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-900 h-10 py-2 px-4"
            >
              Cancelar
            </Link>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
