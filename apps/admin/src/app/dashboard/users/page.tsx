import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsers, getUserCounts, UserStatusFilter } from "./queries";
import { ResetPinButton } from "./_components/ResetPinButton";
import { UserFilterTabs } from "./_components/UserFilterTabs";
import { PosAccessButton } from "./_components/PosAccessButton";
import { UserSearchBar } from "./_components/UserSearchBar";
import { ToggleUserButton } from "./_components/ToggleUserButton";
import { UserPlus, UserX, SearchX, ShieldCheck, Mail, Phone } from "lucide-react";

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

  const renderEmptyState = () => (
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
  );

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

      {/* 1. Vista Mobile: Cards Individuales */}
      <div className="block md:hidden space-y-3">
        {users.length > 0 ? (
          users.map((user: any) => {
            const active = user.active ?? true;
            const isCurrentUser = user.id === session.user.id;

            return (
              <div
                key={user.id}
                className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xs space-y-3 transition-colors ${
                  !active ? "bg-zinc-50/50 dark:bg-zinc-900/40 opacity-75" : ""
                }`}
              >
                {/* Cabecera de la Card: Nombre + Badges + Iconos Acción */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {user.name || "Sin nombre"}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md">
                          Tú
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        {user.role === "DUENO" && <ShieldCheck className="w-3 h-3 text-amber-600" />}
                        {user.role}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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
                  </div>

                  {/* Acciones en Mobile: Iconos directos */}
                  {role === "DUENO" && (
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      {user.role !== "DUENO" && (
                        <ResetPinButton
                          userId={user.id}
                          userName={user.name || user.email}
                          iconOnly
                        />
                      )}
                      {!isCurrentUser && (
                        <ToggleUserButton
                          userId={user.id}
                          userName={user.name || user.email}
                          userRole={user.role}
                          isActive={active}
                          iconOnly
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Info de Contacto de la Card */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5 font-mono truncate">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.numero_tel && (
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{user.numero_tel}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
            {renderEmptyState()}
          </div>
        )}
      </div>

      {/* 2. Vista Desktop: Tabla Corporativa Completa */}
      <div className="hidden md:block rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  {role === "DUENO" && (
                    <th className="px-6 py-4 text-right">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {users.map((user: any) => {
                  const active = user.active ?? true;
                  const isCurrentUser = user.id === session.user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors ${
                        !active ? "bg-zinc-50/30 opacity-75" : ""
                      }`}
                    >
                      {/* Nombre y Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-200 text-sm shrink-0 border border-zinc-200/60 dark:border-zinc-700">
                            {user.name ? user.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                              <span>{user.name || "Sin nombre"}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Teléfono */}
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                        {user.numero_tel || "—"}
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {user.role === "DUENO" && <ShieldCheck className="w-3 h-3 text-amber-600" />}
                          {user.role}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
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
                      </td>

                      {/* Acciones */}
                      {role === "DUENO" && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
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
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}

