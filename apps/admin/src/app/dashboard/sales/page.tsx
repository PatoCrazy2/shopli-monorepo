import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSales, getSucursales } from "./queries";
import { SaleRow } from "./_components/sale-row";
import { SalesCommandBar } from "./_components/sales-command-bar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ SUCURSAL?: string; date?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.empresa_id) redirect("/login");
  if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const rawSucursalId = sp.SUCURSAL;
  const dateStr = sp.date;
  const page = Math.max(1, sp.page ? parseInt(sp.page, 10) || 1 : 1);

  const sucursales = await getSucursales();
  const validSucursal = sucursales.find(s => s.id === rawSucursalId);
  const sucursalId = validSucursal ? validSucursal.id : undefined;

  const { ventas, total, pageSize } = sucursalId
    ? await getSales({ sucursalId, dateStr, page })
    : { ventas: [], total: 0, pageSize: 50 };

  const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total), 0);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Mexico_City"
    }).format(date);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header & CommandBar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Ventas</h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Historial detallado de todas las transacciones generadas en los turnos.
          </p>
        </div>

        <SalesCommandBar
          sucursales={sucursales}
          currentSucursalId={sucursalId}
          currentDate={dateStr}
        />
      </div>

      {sucursalId && (
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 px-1">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Sucursal: {sucursales.find(s => s.id === sucursalId)?.nombre || 'Desconocida'}
            </span>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              {total} {total === 1 ? 'transacción registrada' : 'transacciones registradas'}
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Total Acumulado (Página)
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums">
              ${totalVentas.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col">
        {!sucursalId ? (
          <div className="p-32 flex flex-col items-center justify-center text-center bg-zinc-50/30 dark:bg-zinc-900/10">
            <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-zinc-100 dark:ring-zinc-800 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Selecciona una sucursal</h2>
            <p className="text-zinc-500 max-w-sm mt-2 text-sm font-medium leading-relaxed">
              Para visualizar el historial de ventas y métricas acumuladas, primero debes elegir una sucursal operativa.
            </p>
          </div>
        ) : ventas.length === 0 ? (
          <div className="p-24 text-center bg-zinc-50/30 dark:bg-zinc-900/10 flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-amber-100 dark:ring-amber-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Sin registros para esta búsqueda</h3>
            <p className="text-zinc-500 max-w-xs mt-1 text-sm font-medium">No se encontraron ventas con los filtros actuales. Intenta con otra fecha.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {ventas.map(venta => (
              <SaleRow
                key={venta.id}
                venta={venta}
                formattedDate={formatDate(venta.fecha)}
              />
            ))}
          </div>
        )}

        {sucursalId && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {total} transacciones · Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?SUCURSAL=${sucursalId}${dateStr ? `&date=${dateStr}` : ""}&page=${page - 1}`}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-white"
                >
                  ← Anterior
                </Link>
              )}
              {page * pageSize < total && (
                <Link
                  href={`?SUCURSAL=${sucursalId}${dateStr ? `&date=${dateStr}` : ""}&page=${page + 1}`}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Siguiente →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
