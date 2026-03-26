import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCuts } from "./queries";
import { resolveAuditItem } from "./actions";

export default async function CutsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const turnos = await getCuts();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Mexico_City" // Asumiendo zona horaria MX para POS
    }).format(date);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cortes de Caja</h1>
          <p className="text-muted-foreground mt-2">
            Auditoría de ingresos de cajeros vs sistema.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-8">
        {turnos.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-16 flex flex-col items-center justify-center text-zinc-500 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-zinc-300"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            <p className="font-medium text-lg text-zinc-600">No hay cortes de caja registrados</p>
            <p className="text-sm mt-1">Los turnos cerrados por los cajeros aparecerán aquí.</p>
          </div>
        )}
        
        {turnos.map(turno => {
          const sistema = turno.ventas.reduce((acc, v) => acc + Number(v.total), 0);
          const reportado = Number(turno.total_ventas); 
          const diferencia = reportado - sistema;
          const isClosed = turno.estado === "CERRADO";
          
          // Lógica de diferencia estricta: si es turno abierto, no calculamos faltante aún.
          // Comparamos usando un margen mínimo de .01 para evitar problemas de coma flotante en JS.
          const isBalanced = Math.abs(diferencia) < 0.01;
          
          return (
            <div key={turno.id} className={`bg-white border rounded-xl p-6 shadow-sm transition-all hover:shadow-md relative overflow-hidden ${
              isClosed ? 'border-zinc-200' : 'border-amber-200 shadow-amber-500/5'
            }`}>
              
              {/* Barra lateral indicadora */}
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                !isClosed ? 'bg-amber-400' :
                isBalanced ? 'bg-emerald-500' : 'bg-rose-500'
              }`} />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pl-4">
                <div>
                   <div className="flex items-center gap-3">
                     <span className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center text-sm font-bold shadow-sm ring-1 ring-zinc-200">
                       {(turno.usuario.name || "U")[0]}
                     </span>
                     <h3 className="font-bold tracking-tight text-xl text-zinc-900">{turno.usuario.name || 'Cajero Desconocido'}</h3>
                     <span className={`px-2.5 py-1 text-[10px] font-black tracking-widest uppercase rounded-full border ${
                       isClosed ? 'bg-zinc-100 text-zinc-600 border-zinc-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                     }`}>
                       {turno.estado}
                     </span>
                   </div>
                   
                   <div className="text-sm font-medium text-zinc-500 mt-2 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                     <span className="text-zinc-700">{formatDate(turno.fecha_apertura)}</span>
                     {turno.fecha_cierre ? (
                       <>
                         <span className="text-zinc-300">→</span>
                         <span className="text-zinc-700">{formatDate(turno.fecha_cierre)}</span>
                       </>
                     ) : (
                       <span className="text-amber-600">(Turno activo)</span>
                     )}
                   </div>
                   
                   <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
                     {turno.sucursal.nombre}
                   </div>
                </div>
                
                <div className="bg-zinc-50/80 px-5 py-3 rounded-xl border border-zinc-100 flex flex-col items-center md:items-end">
                   <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fondo de Caja (Monto Inicial)</span>
                   <span className="font-black text-2xl text-zinc-900">${Number(turno.monto_inicial).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-100 pl-4">
                <div className="flex flex-col p-4 rounded-xl bg-zinc-50/80 border border-zinc-100/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Reportado por cajero</span>
                  <span className={`text-3xl font-black tracking-tight ${!isClosed ? 'text-zinc-300' : 'text-zinc-900'}`}>
                    ${isClosed ? reportado.toFixed(2) : '-.--'}
                  </span>
                  <p className="text-xs text-zinc-400 mt-2">Total de ventas indicado al momento de cerrar caja.</p>
                </div>
                
                <div className="flex flex-col p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500/80 mb-1">Calculado por sistema</span>
                  <span className="text-3xl font-black tracking-tight text-indigo-600">${sistema.toFixed(2)}</span>
                  <p className="text-xs text-indigo-400/80 mt-2">Acumulado real basado en transacciones de sistema.</p>
                </div>

                <div className={`flex flex-col p-4 rounded-xl border shadow-sm ${
                  !isClosed ? 'border-zinc-100 bg-white' : 
                  isBalanced ? 'bg-emerald-50 border-emerald-200' : 
                  'bg-rose-50 border-rose-200'
                }`}>
                  <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                    !isClosed ? 'text-zinc-400' :
                    isBalanced ? 'text-emerald-700' : 'text-rose-700'
                  }`}>Diferencia</span>
                  <span className={`text-3xl font-black tracking-tight ${
                    !isClosed ? 'text-zinc-300' :
                    isBalanced ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                     {!isClosed ? '-.--' : `${diferencia > 0 ? '+' : ''}${isBalanced ? '0.00' : diferencia.toFixed(2)}`}
                  </span>
                  <p className={`text-xs mt-2 font-medium ${
                    !isClosed ? 'text-zinc-400' :
                    isBalanced ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                     {!isClosed ? 'Se calculará al cierre.' : isBalanced ? 'Caja cuadrada perfectamente.' : (diferencia > 0 ? 'Excedente de efectivo detectado.' : 'Faltante de efectivo detectado.')}
                  </p>
                </div>
              </div>
              
              {/* Auditoría Ciega de Inventario */}
              {turno.auditorias.length > 0 && (
                <div className="mt-8 pt-6 border-t border-zinc-100">
                  <h4 className="text-sm font-bold tracking-tight text-zinc-900 mb-4 px-4">
                    Auditoría de Inventario a Ciegas
                  </h4>
                  {turno.auditorias.map(audit => (
                    <div key={audit.id} className="overflow-x-auto rounded-lg border border-zinc-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 border-b">
                          <tr>
                            <th className="px-4 py-3 font-medium text-zinc-500">Producto</th>
                            <th className="px-4 py-3 text-center font-medium text-zinc-500">Esperado</th>
                            <th className="px-4 py-3 text-center font-medium text-zinc-500">Contado</th>
                            <th className="px-4 py-3 text-center font-medium text-zinc-500">Diferencia</th>
                            <th className="px-4 py-3 text-center font-medium text-zinc-500">Estado</th>
                            <th className="px-4 py-3 text-right font-medium text-zinc-500 min-w-[300px]">Resolución</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {audit.items.map((item: any) => {
                            const isResolved = item.resolved;
                            const hasDiscrepancy = item.discrepancy !== 0;

                            return (
                              <tr key={item.id} className="hover:bg-zinc-50/50">
                                <td className="px-4 py-3 font-medium text-zinc-900">
                                  {item.producto.nombre}
                                </td>
                                <td className="px-4 py-3 text-center text-zinc-600">
                                  {item.expectedStock}
                                </td>
                                <td className="px-4 py-3 text-center text-zinc-900 font-semibold">
                                  {item.countedStock}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                                    !hasDiscrepancy ? 'bg-zinc-100 text-zinc-500' :
                                    item.discrepancy > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {!hasDiscrepancy ? (
                                    <span className="text-xs text-zinc-400 font-medium">Cuadrado</span>
                                  ) : isResolved ? (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700">
                                      Resuelto
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 animate-pulse">
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {!hasDiscrepancy ? (
                                    <span className="text-xs text-emerald-600 font-medium">—</span>
                                  ) : isResolved ? (
                                    <div className="text-left text-xs bg-zinc-50 p-2 rounded-md border border-zinc-100">
                                      <div className="font-semibold text-zinc-700">Razón: {item.reason}</div>
                                      {item.comments && <div className="text-zinc-500 italic mt-1 font-mono">"{item.comments}"</div>}
                                    </div>
                                  ) : (
                                    <form action={resolveAuditItem as any} className="flex flex-col gap-2 items-end">
                                      <input type="hidden" name="id" value={item.id} />
                                      <input type="hidden" name="sucursalId" value={turno.sucursal_id} />
                                      
                                      <select 
                                        name="reason" 
                                        required
                                        className="h-8 w-full max-w-[200px] rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                                      >
                                        <option value="">Seleccionar razón del descuadre...</option>
                                        <option value="Error de registro (POS)">Error al registrar venta o ingresar producto</option>
                                        <option value="Faltante de anaquel/Robo">Mercancía no encontrada en el local físico</option>
                                        <option value="Daño/Merma">Mercancía dañada/caducada y devuelta sin sistema</option>
                                      </select>
                                      
                                      <div className="flex w-full max-w-[200px] gap-2">
                                        <input 
                                          type="text" 
                                          name="comments" 
                                          placeholder="Nota Opcional..." 
                                          className="flex-1 h-8 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                                        />
                                        <button 
                                          type="submit"
                                          className="h-8 px-3 bg-zinc-900 text-white rounded-md font-medium text-xs hover:bg-zinc-800 transition-colors shadow-sm"
                                        >
                                          Resolver
                                        </button>
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
              
              <div className="mt-4 pt-4 text-right flex justify-end pl-4 border-t border-zinc-100/50">
                 <span className="text-[10px] text-zinc-300 font-mono tracking-widest uppercase align-bottom">Turno ID: {turno.id}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
