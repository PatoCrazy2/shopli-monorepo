import { db } from "@shopli/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, ArrowRight, Calendar, MapPin, CheckCircle2, Clock, Filter } from "lucide-react";
import { SucursalFilter } from "./SucursalFilter";
import { canAccessDynamicAudits } from "@/lib/check-plan-limits";
import { UpgradeGateBanner } from "@/components/UpgradeGateBanner";

export const dynamic = "force-dynamic";

export default async function AuditsListPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ sucursalId?: string }> 
}) {
  const session = await auth();
  if (!session?.user?.empresa_id) redirect("/login");
  const empresaId = session.user.empresa_id;

  const hasAuditsAccess = await canAccessDynamicAudits(empresaId);

  if (!hasAuditsAccess) {
    return (
      <div className="flex-1 w-full flex flex-col p-8 bg-zinc-50 dark:bg-black min-h-screen space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Auditorías Dinámicas</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Historial de conteos ciegos realizados desde el POS y estado de conciliación.
            </p>
          </div>
        </div>

        <UpgradeGateBanner
          title="Auditorías Dinámicas de Inventario"
          description="Controla mermas y previene robos ejecutando conteos ciegos en el POS con conciliación automática en tiempo real."
          featureList={[
            "Conteos ciegos en POS sin revelar el stock del sistema",
            "Conciliación de diferencias con registro automático de ajustes",
            "Historial de discrepancias por producto y sucursal",
            "Mapeo de pérdidas monetarias por faltantes",
          ]}
          requiredPlanName="Plan Crecimiento"
        />
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const sucursalId = resolvedSearchParams.sucursalId;

  // Si envían un sucursalId específico, verificar pertenencia
  if (sucursalId) {
    const sucursalVal = await db.sucursal.findUnique({
      where: { id: sucursalId },
      select: { empresa_id: true }
    });
    if (!sucursalVal || sucursalVal.empresa_id !== empresaId) {
      redirect("/dashboard/audits");
    }
  }

  const [audits, sucursales] = await Promise.all([
    db.dynamicAudit.findMany({
      where: sucursalId 
        ? { sucursalId, sucursal: { empresa_id: empresaId } } 
        : { sucursal: { empresa_id: empresaId } },
      include: {
        sucursal: true,
        _count: {
          select: { items: true }
        },
        items: {
          select: {
            difference: true,
            countedQuantity: true,
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    }),
    db.sucursal.findMany({
      where: { empresa_id: empresaId, activo: true },
      select: { id: true, nombre: true }
    })
  ]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20">
      {/* 1. Header Card (Estilo ShopLI / Apple Crisp) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Auditorías Dinámicas
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
              {audits.length}
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">
            Historial de conteos físicos y conciliación de inventario por sucursal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SucursalFilter sucursales={sucursales} currentValue={sucursalId} />
          {sucursalId && (
            <Link 
              href="/dashboard/audits"
              className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-600 dark:text-zinc-400 transition-colors flex items-center justify-center shrink-0"
              title="Restablecer filtro de sucursal"
            >
              Limpiar
            </Link>
          )}
        </div>
      </div>

      {/* 2. Listado de Auditorías o Estado Vacío */}
      <div className="flex flex-col gap-3">
        {audits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 px-6 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="w-14 h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
              <ClipboardCheck className="w-6 h-6 text-zinc-900 dark:text-zinc-100" strokeWidth={1.5} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
              {sucursalId ? "No hay auditorías en esta sucursal" : "No hay auditorías registradas"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 font-medium">
              Los conteos ciegos iniciados y finalizados desde el POS aparecerán automáticamente aquí.
            </p>
          </div>
        ) : (
          audits.map((audit) => {
            const hasDiscrepancies = audit.items.some(
              (item) => item.difference !== null && item.difference !== 0
            );

            return (
              <Link 
                key={audit.id} 
                href={`/dashboard/audits/${audit.id}`}
                className="group bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  {/* Ícono Monocromático de Estado */}
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center shrink-0 text-zinc-900 dark:text-zinc-100 shadow-2xs">
                    <ClipboardCheck className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white tracking-tight truncate">
                        Auditoría de Inventario
                      </h3>

                      {/* Badges de Estado con Punto Sutil */}
                      {audit.isApplied ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Conciliado</span>
                        </span>
                      ) : audit.status === "CLOSED" ? (
                        hasDiscrepancies ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span>Pdte. Ajuste</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>Sin Diferencias</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                          <span>En Curso</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Metadata secundaria */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{audit.sucursal.nombre}</span>
                      </div>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{new Date(audit.startedAt).toLocaleDateString()}</span>
                      </div>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{new Date(audit.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <span className="font-mono text-zinc-600 dark:text-zinc-400">
                        {audit._count.items} {audit._count.items === 1 ? "producto" : "productos"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-zinc-100 dark:group-hover:bg-zinc-900 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
