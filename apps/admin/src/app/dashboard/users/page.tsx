import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { toggleUser } from "./actions";
import { getUsers } from "./queries";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "DUENO" && role !== "ENCARGADO") {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona cajeros y encargados de tienda
          </p>
        </div>
        {role === "DUENO" && (
          <Link
            href="/dashboard/users/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-zinc-900 text-white hover:bg-zinc-900/90 h-10 py-2 px-4 shadow-sm"
          >
            Nuevo Usuario
          </Link>
        )}
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-500">Nombre</th>
              <th className="px-6 py-4 font-medium text-zinc-500">Email</th>
              <th className="px-6 py-4 font-medium text-zinc-500">Teléfono</th>
              <th className="px-6 py-4 font-medium text-zinc-500">Rol</th>
              <th className="px-6 py-4 font-medium text-zinc-500">Estado</th>
              {role === "DUENO" && (
                <th className="px-6 py-4 font-medium text-zinc-500 text-right">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user: any) => {
              const active = user.active ?? true;
              const toggleAction = toggleUser.bind(null, user.id, active);
              return (
                <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{user.name || "Sin nombre"}</td>
                  <td className="px-6 py-4 text-zinc-500">{user.email}</td>
                  <td className="px-6 py-4 text-zinc-500">{user.numero_tel || "—"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      active 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {role === "DUENO" && session?.user && (
                    <td className="px-6 py-4 text-right space-x-2">
                       {/* Un botón simple en form en RSC, o podríamos tener components cliente,
                           pero limitándonos a 3 archivos: */}
                       {user.id !== session.user.id && (
                         <form action={toggleAction} className="inline-block">
                           <button
                             type="submit"
                             className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                               active
                                 ? "bg-red-50 text-red-600 hover:bg-red-100"
                                 : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                             }`}
                           >
                             {active ? "Desactivar" : "Activar"}
                           </button>
                         </form>
                       )}
                    </td>
                  )}
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={role === "DUENO" ? 6 : 5} className="px-6 py-8 text-center text-zinc-500">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
