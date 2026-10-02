import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsers, getUserCounts, UserStatusFilter } from "./queries";
import { ResetPinButton } from "./_components/ResetPinButton";
import { UserFilterTabs } from "./_components/UserFilterTabs";
import { PosAccessButton } from "./_components/PosAccessButton";
import { UserSearchBar } from "./_components/UserSearchBar";
import { ToggleUserButton } from "./_components/ToggleUserButton";
import { UserPlus, UserX, SearchX, ShieldCheck } from "lucide-react";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "DUENO" && role !== "ENCARGADO") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const currentTab = (params.tab as UserStatusFilter) || "active";
  const searchQuery = params.q || "";

  const [users, counts] = await Promise.all([
    getUsers({ status: currentTab, search: searchQuery }),
    getUserCounts(),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Compacto Mobile-First */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Usuarios</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono tabular-nums">
              {counts.active} activos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Gestiona cajeros y encargados de tienda registrados en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <PosAccessButton />
          {role === "DUENO" && (
            <Link
              href="/dashboard/users/new"
              className="inline-flex h-9 sm:h-10 flex-1 sm:flex-initial items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 px-4 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200 gap-1.5 shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>Nuevo Usuario</span>
            </Link>
          )}
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <UserFilterTabs counts={counts} />
        <UserSearchBar />
      </div>

      {/* Lista de Usuarios (Tarjetas Largas Mobile-First) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
        {users.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {users.map((user: any) => {
              const active = user.active ?? true;
              const isCurrentUser = user.id === session.user.id;

              return (
                <div
                  key={user.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-4 gap-3 sm:gap-4 transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 ${
                    !active ? "bg-zinc-50/40 opacity-75" : ""
                  }`}
                >
                  {/* Info Usuario: Avatar + Nombre + Email + Teléfono */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-200 text-sm shrink-0 border border-zinc-200/60 dark:border-zinc-700">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-zinc-900 dark:text-white truncate text-sm sm:text-base">
                          {user.name || "Sin nombre"}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md">
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-mono text-zinc-500 dark:text-zinc-400 truncate">
                          {user.email}
                        </span>
                        {user.numero_tel && (
                          <>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                              {user.numero_tel}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges de Rol y Estado + Acciones */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-zinc-100 dark:border-zinc-800/60 sm:border-0">
                    <div className="flex items-center gap-2">
                      {/* Rol */}
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {user.role === "DUENO" && <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                        {user.role}
                      </span>

                      {/* Estado */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            active ? "bg-emerald-500" : "bg-zinc-400"
                          }`}
                        />
                        {active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    {/* Acciones */}
                    {role === "DUENO" && (
                      <div className="flex items-center gap-1.5">
                        {user.role !== "DUENO" && (
                          <ResetPinButton
                            userId={user.id}
                            userName={user.name || user.email}
                          />
                        )}

                        {!isCurrentUser && (
                          <ToggleUserButton
                            userId={user.id}
                            userName={user.name || user.email}
                            userRole={user.role}
                            isActive={active}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty States */
          <div className="px-6 py-16 text-center text-zinc-500">
            <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-3">
              {searchQuery ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <SearchX className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    No se encontraron resultados
                  </p>
                  <p className="text-xs text-zinc-400">
                    No hay ningún usuario que coincida con &quot;{searchQuery}&quot;.
                  </p>
                </>
              ) : currentTab === "inactive" ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <UserX className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    No hay usuarios inactivos
                  </p>
                  <p className="text-xs text-zinc-400">
                    Todos los usuarios de tu equipo se encuentran activos y operativos.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    No hay usuarios registrados
                  </p>
                  <p className="text-xs text-zinc-400">
                    Registra cajeros o encargados para comenzar a operar tus sucursales.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

