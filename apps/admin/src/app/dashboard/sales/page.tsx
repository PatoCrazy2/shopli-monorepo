import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSales, getSucursales } from "./queries";
import Link from "next/link";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ SUCURSAL?: string; date?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const sucursalId = sp.SUCURSAL;
  const dateStr = sp.date;

  const ventas = await getSales({ sucursalId, dateStr });

  const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total), 0);

  const sucursales = await getSucursales();

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
               {ventas.length} transacciones registradas
            </span>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Total Acumulado</span>
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
          <div className="divide-y divide-zinc-200">
            {ventas.map(venta => (
              <details key={venta.id} className="group transition-colors list-none">
                <summary className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 outline-none focus-visible:bg-zinc-50 transition-colors [&::-webkit-details-marker]:hidden gap-4">
                  <div className="flex flex-1 items-center gap-6 flex-wrap">
                    <div className="w-full sm:w-48 text-sm font-semibold text-zinc-700">
                      {formatDate(venta.fecha)}
                    </div>
                    
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                       <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase ring-1 ring-indigo-200">
                         {(venta.turno.usuario.name || "U")[0]}
                       </span>
                       <span className="text-sm font-medium text-zinc-900">{venta.turno.usuario.name || 'Desconocido'}</span>
                    </div>

                    <div className="text-zinc-500 text-sm flex items-center gap-2">
                      <span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold text-zinc-600 border border-zinc-200">
                        {venta.detalles.length} ITEMS
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t border-zinc-100 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
                      venta.estado === 'COMPLETADA' 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}>
                      {venta.estado}
                    </span>
                    
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-lg text-zinc-900 min-w-[80px] text-right">
                        ${Number(venta.total).toFixed(2)}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-open:rotate-180 transition-transform"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </summary>
                
                {/* Contenido expandible usando details */}
                <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 text-sm shadow-inner group-open:animate-in group-open:fade-in group-open:slide-in-from-top-2">
                  <div className="max-w-4xl mx-auto bg-white rounded-lg border border-zinc-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-zinc-100 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          <th className="py-3 px-4 w-1/2">Producto</th>
                          <th className="py-3 px-4 text-center">Cant.</th>
                          <th className="py-3 px-4 text-right">Precio unitario</th>
                          <th className="py-3 px-4 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {venta.detalles.map(d => (
                          <tr key={d.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="py-3 px-4 font-medium text-zinc-800">{d.producto.nombre}</td>
                            <td className="py-3 px-4 text-center text-zinc-600 font-medium">x{d.cantidad}</td>
                            <td className="py-3 px-4 text-right text-zinc-600">${Number(d.precio_unitario_historico).toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-semibold text-zinc-900">${(Number(d.precio_unitario_historico) * d.cantidad).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex justify-end px-2">
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Venta ID: {venta.id}</span>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
