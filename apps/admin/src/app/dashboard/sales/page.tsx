import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSales, getSucursales } from "./queries";
import { SaleRow } from "./_components/sale-row";
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
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header & Filters (Unified as in Cuts) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Ventas</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Historial detallado de todas las transacciones generadas en los turnos.
          </p>
        </div>
        
        <form method="GET" className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="SUCURSAL" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Sucursal</label>
            <select 
              name="SUCURSAL" 
              id="SUCURSAL"
              defaultValue={sucursalId || ""}
              required
              className="h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all appearance-none pr-10 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
            >
              <option value="" disabled>Seleccionar sucursal...</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Fecha</label>
            <input 
              type="date" 
              name="date" 
              id="date"
              defaultValue={dateStr || ""}
              className="h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 transition-all font-mono"
            />
          </div>

          <button 
            type="submit"
            className="h-11 mt-auto px-8 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
          >
            Filtrar
          </button>
          
          {(dateStr || sucursalId) && (
            <Link 
              href="/dashboard/sales" 
              className="h-11 mt-auto px-5 bg-zinc-100 text-zinc-600 flex items-center justify-center rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {sucursalId && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
              Sucursal: {sucursales.find(s => s.id === sucursalId)?.nombre || 'Desconocida'}
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-sm font-bold text-zinc-500">
               {total} transacciones registradas
            </span>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Total Acumulado (Página)</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">${totalVentas.toFixed(2)}</span>
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
