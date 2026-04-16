import { db } from "@shopli/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, ArrowRight, Calendar, MapPin, CheckCircle2, Clock, Filter } from "lucide-react";
import { SucursalFilter } from "./SucursalFilter";

export default async function AuditsListPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ sucursalId?: string }> 
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const sucursalId = resolvedSearchParams.sucursalId;

  const [audits, sucursales] = await Promise.all([
    db.dynamicAudit.findMany({
      where: sucursalId ? { sucursalId } : undefined,
      include: {
        sucursal: true,
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    }),
    db.sucursal.findMany({
      select: { id: true, nombre: true }
    })
  ]);

  return (
    <div className="flex-1 w-full flex flex-col p-8 bg-zinc-50 dark:bg-black min-h-screen space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Auditorías Dinámicas</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Historial de conteos ciegos realizados desde el POS y estado de conciliación.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <SucursalFilter sucursales={sucursales} currentValue={sucursalId} />
            {sucursalId && (
              <Link 
                href="/dashboard/audits"
                className="text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline underline-offset-4 ml-2"
              >
                Limpiar
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {audits.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <ClipboardCheck className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium text-lg">No hay auditorías registradas aún.</p>
            <p className="text-zinc-400 text-sm">Las auditorías iniciadas desde el POS aparecerán aquí.</p>
          </div>
        ) : (
          audits.map((audit) => (
            <Link 
              key={audit.id} 
              href={`/dashboard/audits/${audit.id}`}
              className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${audit.status === 'CLOSED' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600'}`}>
                   <ClipboardCheck className="w-6 h-6" />
                </div>
                
                <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                       <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                          Auditoría de Inventario
                       </h3>
                       {audit.isApplied ? (
                           <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-md">Conciliado</span>
                       ) : audit.status === 'CLOSED' ? (
                           <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-md">Pdte. Ajuste</span>
                       ) : (
                           <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-md">Abierta</span>
                       )}
                   </div>
                   
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                      <div className="flex items-center gap-1.5 font-medium">
                         <MapPin className="w-3.5 h-3.5" /> {audit.sucursal.nombre}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Calendar className="w-3.5 h-3.5" /> {new Date(audit.startedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Clock className="w-3.5 h-3.5" /> {new Date(audit.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <ArrowRight className="w-3.5 h-3.5" /> {audit._count.items} productos
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-2 rounded-full group-hover:bg-zinc-100 dark:group-hover:bg-zinc-900 transition-colors text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                 <ArrowRight className="w-6 h-6" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
