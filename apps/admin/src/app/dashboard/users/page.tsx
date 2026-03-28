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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Usuarios</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Gestiona cajeros y encargados de tienda registrados en el sistema.
          </p>
        </div>
        
        {role === "DUENO" && (
          <Link
            href="/dashboard/users/new"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-6 text-sm font-bold text-white transition-all hover:bg-zinc-800 shadow-lg active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
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
