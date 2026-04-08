import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCuts } from "./queries";
import { resolveAuditItem } from "./actions";
import { getSucursales } from "../branches/queries";
import Link from "next/link";

export default async function CutsPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string; date?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const sucursalId = params.sucursal;
  const date = params.date || new Date().toISOString().split('T')[0];

  const [turnos, sucursales] = await Promise.all([
    getCuts(sucursalId, date),
    getSucursales()
  ]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Mexico_City"
    }).format(date);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Cortes de Caja</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Auditoría de ingresos y conciliación de inventario.
          </p>
        </div>

        <form method="GET" className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Sucursal</label>
            <select
              name="sucursal"
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
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Fecha de Apertura</label>
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
            />
          </div>

          <button
            type="submit"
            className="h-11 mt-auto px-6 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
          >
            Filtrar
          </button>

          {sucursalId && (
            <Link
              href="/dashboard/cuts"
              className="h-11 mt-auto px-4 flex items-center justify-center bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="flex flex-col gap-6">
        {!sucursalId ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-24 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 ring-1 ring-zinc-100 dark:ring-zinc-800 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Selecciona una sucursal</h2>
            <p className="text-zinc-500 max-w-xs mt-2 font-medium">
              Para visualizar los cortes de caja y auditorías, primero debes elegir una sucursal en el panel superior.
            </p>
          </div>
        ) : turnos.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-24 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-amber-100 dark:ring-amber-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Sin registros para esta fecha</h2>
            <p className="text-zinc-500 max-w-xs mt-2 font-medium">
              No se encontraron turnos abiertos o cerrados en la sucursal seleccionada para el día indicado.
            </p>
          </div>
        ) : (
          turnos.map(turno => {
            const ventasSistema = turno.ventas.reduce((acc, v) => acc + Number(v.total), 0);
            const sistema = ventasSistema + Number(turno.monto_inicial);
            const reportado = turno.monto_final ? Number(turno.monto_final) : 0;
            const diferencia = reportado - sistema;
            const isClosed = turno.estado === "CERRADO";
            const isBalanced = Math.abs(diferencia) < 0.01;

            return (
              <div key={turno.id} className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${!isClosed ? 'bg-amber-400' : isBalanced ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                <div className="flex flex-col lg:flex-row justify-between gap-8 mb-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-lg font-black shadow-lg">
                        {(turno.usuario.name || "U")[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-2xl text-zinc-900 dark:text-white tracking-tight">{turno.usuario.name || 'Cajero Desconocido'}</h3>
                          <span className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-full border shadow-sm ${isClosed ? 'bg-zinc-100 text-zinc-600 border-zinc-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'}`}>
                            {turno.estado}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 mt-1 uppercase tracking-tighter">
                          <span>{turno.sucursal.nombre}</span>
                          <span className="opacity-30">•</span>
                          <span className="font-mono text-zinc-300">#{turno.id.slice(-6)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-2 px-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 w-fit">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{formatDate(turno.fecha_apertura)}</span>
                      </div>
                      {turno.fecha_cierre && (
                        <>
                          <span className="text-zinc-300">→</span>
                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{formatDate(turno.fecha_cierre!)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-zinc-900 dark:bg-white px-8 py-4 rounded-2xl flex flex-col items-center lg:items-end justify-center shadow-xl">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Monto Inicial</span>
                    <span className="font-black text-3xl text-white dark:text-black tracking-tighter">${Number(turno.monto_inicial).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-900">
                  <div className="flex flex-col p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Reportado físico</span>
                    <span className={`text-4xl font-black tracking-tighter ${!isClosed ? 'text-zinc-300' : 'text-zinc-900 dark:text-white'}`}>
                      ${isClosed ? reportado.toFixed(2) : '--.--'}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-3 font-medium leading-relaxed">Lo que el cajero contó y declaró manualmente al cerrar.</p>
                  </div>

                  <div className="flex flex-col p-6 rounded-2xl bg-black dark:bg-zinc-800 border border-black shadow-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Calculado sistema</span>
                    <span className="text-4xl font-black tracking-tighter text-white">${sistema.toFixed(2)}</span>
                    <p className="text-[11px] text-zinc-500 mt-3 font-medium leading-relaxed">Suma de ventas completadas + fondo inicial.</p>
                  </div>

                  <div className={`flex flex-col p-6 rounded-2xl border shadow-sm transition-colors ${!isClosed ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800' : isBalanced ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-2 ${!isClosed ? 'text-zinc-400' : isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>Diferencia</span>
                    <span className={`text-4xl font-black tracking-tighter ${!isClosed ? 'text-zinc-300' : isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {!isClosed ? '--.--' : `${diferencia > 0 ? '+' : ''}${isBalanced ? '0.00' : diferencia.toFixed(2)}`}
                    </span>
                    <p className={`text-[11px] mt-3 font-bold leading-relaxed ${!isClosed ? 'text-zinc-400' : isBalanced ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>
                      {!isClosed ? 'Se calculará al cierre.' : isBalanced ? 'Caja cuadrada perfectamente.' : (diferencia > 0 ? 'Excedente (Sobra Dinero).' : 'Faltante (Falta Dinero).')}
                    </p>
                  </div>
                </div>

                {/* Inventory Audits Section */}
                {turno.auditorias.length > 0 && (
                  <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-1 w-12 bg-black dark:bg-white rounded-full" />
                      <h4 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-900 dark:text-white">
                        Auditoría de Inventario "A Ciegas"
                      </h4>
                    </div>

                    {turno.auditorias.map(audit => (
                      <div key={audit.id} className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Producto</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Sistema</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Contado</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Dif.</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">Estado</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">Resolución</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 bg-white dark:bg-zinc-950">
                            {audit.items.map((item: any) => {
                              const isResolved = item.resolved;
                              const hasDiscrepancy = item.discrepancy !== 0;

                              return (
                                <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                                  <td className="px-6 py-4">
                                    <span className="font-bold text-zinc-900 dark:text-white">{item.producto.nombre}</span>
                                    <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{item.producto.codigo_interno}</div>
                                  </td>
                                  <td className="px-6 py-4 text-center text-zinc-500 font-medium">
                                    {item.expectedStock}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="inline-flex h-8 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 font-black text-zinc-900 dark:text-white ring-1 ring-zinc-200 dark:ring-zinc-800">
                                      {item.countedStock}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2 py-1 rounded-md text-[11px] font-black ${!hasDiscrepancy ? 'text-zinc-300' : item.discrepancy > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                                      {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {!hasDiscrepancy ? (
                                      <div className="flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-zinc-200" /></div>
                                    ) : isResolved ? (
                                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">OK</span>
                                    ) : (
                                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-amber-100 text-amber-700 animate-pulse">PEND</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {!hasDiscrepancy ? (
                                      <span className="text-[10px] font-black text-emerald-600/50 italic">Sincronizado</span>
                                    ) : isResolved ? (
                                      <div className="inline-block text-left text-[11px] bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 max-w-[240px]">
                                        <div className="font-black text-zinc-700 dark:text-zinc-300 truncate">{item.reason}</div>
                                        {item.comments && <div className="text-zinc-400 italic mt-0.5 line-clamp-1">{item.comments}</div>}
                                      </div>
                                    ) : (
                                      <form action={resolveAuditItem as any} className="flex flex-col gap-2 items-end">
                                        <input type="hidden" name="id" value={item.id} />
                                        <input type="hidden" name="sucursalId" value={turno.sucursal_id} />
                                        <div className="flex items-center gap-2">
                                          <select
                                            name="reason"
                                            required
                                            className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-[11px] font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-black outline-none"
                                          >
                                            <option value="">Razón...</option>
                                            <option value="Error de registro (POS)">Error de Registro</option>
                                            <option value="Faltante de anaquel/Robo">Faltante/Robo</option>
                                            <option value="Daño/Merma">Daño/Merma</option>
                                          </select>
                                          <input
                                            type="text"
                                            name="comments"
                                            placeholder="Notas..."
                                            className="h-8 w-24 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-[11px] focus:ring-2 focus:ring-black outline-none"
                                          />
                                          <button type="submit" className="h-8 px-3 bg-black text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all">OK</button>
                                        </div>
                                      </form>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
