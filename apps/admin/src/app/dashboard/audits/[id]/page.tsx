import { db } from "@shopli/db";
import { redirect } from "next/navigation";
import AuditReportClient from "./AuditReportClient";
import { auth } from "@/lib/auth";
import { canAccessDynamicAudits } from "@/lib/check-plan-limits";

export const dynamic = "force-dynamic";

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.empresa_id) redirect("/login");
  const empresaId = session.user.empresa_id;

  const { id } = await params;

  const [hasAuditsAccess, audit, ajusteCount] = await Promise.all([
    canAccessDynamicAudits(empresaId),
    db.dynamicAudit.findFirst({
      where: {
        id,
        sucursal: { empresa_id: empresaId },
      },
      select: {
        id: true,
        status: true,
        isApplied: true,
        startedAt: true,
        finishedAt: true,
        sucursal: {
          select: { nombre: true },
        },
        iniciadaPor: {
          select: { name: true },
        },
        finalizadaPor: {
          select: { name: true },
        },
        items: {
          where: {
            producto: {
              OR: [
                { parent_id: { not: null } },
                { parent_id: null, variants: { none: { isActive: true } } },
              ],
            },
          },
          select: {
            id: true,
            productId: true,
            initialStock: true,
            countedQuantity: true,
            countedAt: true,
            expectedAtCount: true,
            difference: true,
            producto: {
              select: {
                nombre: true,
                costo: true,
              },
            },
          },
        },
      },
    }),
    db.movimientoInventario.count({
      where: {
        referencia_id: id,
        tipo: "AJUSTE",
        sucursal: { empresa_id: empresaId },
      },
    }),
  ]);

  if (!hasAuditsAccess || !audit) {
    redirect("/dashboard/audits");
  }

  const formattedAudit = {
    id: audit.id,
    branchName: audit.sucursal.nombre,
    status: audit.status,
    isApplied: audit.isApplied,
    hasAdjustments: ajusteCount > 0,
    startedAt: audit.startedAt.toISOString(),
    finishedAt: audit.finishedAt ? audit.finishedAt.toISOString() : null,
    startedBy: audit.iniciadaPor?.name || "Desconocido",
    finishedBy: audit.finalizadaPor?.name || "Desconocido",
    items: audit.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.producto.nombre,
      cost: Number(item.producto.costo),
      initialStock: item.initialStock,
      countedQuantity: item.countedQuantity,
      countedAt: item.countedAt ? item.countedAt.toISOString() : null,
      expectedStock: item.expectedAtCount,
      difference: item.difference,
      sales: item.expectedAtCount !== null ? item.initialStock - item.expectedAtCount : 0,
    })),
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20">
      <AuditReportClient audit={formattedAudit} />
    </div>
  );
}
