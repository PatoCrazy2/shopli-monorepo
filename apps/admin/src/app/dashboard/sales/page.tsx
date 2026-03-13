import { db } from "@shopli/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ CAJERO?: string; date?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const cajeroId = sp.CAJERO;
  const dateStr = sp.date;

  const where: any = {};

  if (cajeroId) {
    where.turno = { usuario_id: cajeroId };
  }

  if (dateStr) {
    const start = new Date(`${dateStr}T00:00:00.000Z`);
    const end = new Date(`${dateStr}T23:59:59.999Z`);
    where.fecha = { gte: start, lte: end };
  }

  const ventas = await db.venta.findMany({
    where,
    orderBy: { fecha: "desc" },
    include: {
      turno: {
        include: {
          usuario: {
            select: { name: true, id: true }
          }
        }
      },
      detalles: {
        include: {
          producto: { select: { nombre: true } }
        }
      }
    }
  });

  const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total), 0);

  const cajeros = await db.user.findMany({
    where: { role: { in: ["CAJERO", "ENCARGADO", "DUENO"] } },
    select: { id: true, name: true }
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Mexico_City"
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground mt-2">
            Historial detallado de todas las transacciones generadas en los turnos.
          </p>
        </div>
        
        <div className="bg-zinc-900 text-white px-6 py-4 rounded-xl shadow-sm min-w-[200px] flex items-center justify-between gap-6">
          <div className="text-zinc-200 text-sm font-medium uppercase tracking-wider">Total Acumulado</div>
          <div className="text-3xl font-bold text-emerald-400">${totalVentas.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200">
        <form method="GET" className="flex flex-col md:flex-row items-end gap-4">
          <div className="space-y-1 w-full md:w-auto">
            <label htmlFor="date" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Filtrar por Fecha</label>
            <input 
              type="date" 
              name="date" 
              id="date"
              defaultValue={dateStr || ""}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            />
          </div>
          
          <div className="space-y-1 w-full md:w-auto">
            <label htmlFor="CAJERO" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Filtar por Cajero</label>
            <select 
              name="CAJERO" 
              id="CAJERO"
              defaultValue={cajeroId || ""}
              className="flex h-10 w-full min-w-[240px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              <option value="">Todos los usuarios</option>
              {cajeros.map(c => (
                <option key={c.id} value={c.id}>{c.name || "Sin Nombre"}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            className="h-10 px-5 bg-zinc-900 text-white rounded-md font-medium text-sm hover:bg-zinc-800 transition-colors w-full md:w-auto shadow-sm"
          >
            Aplicar
          </button>
          
          {(dateStr || cajeroId) && (
            <a 
              href="/dashboard/sales" 
              className="h-10 px-5 bg-zinc-100 text-zinc-700 flex items-center justify-center rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors w-full md:w-auto"
            >
              Limpiar
            </a>
          )}
        </form>
      </div>

      <div className="border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
        {ventas.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 bg-zinc-50/50">
            No se encontraron ventas para estos filtros. Modifica la búsqueda e intenta de nuevo.
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
