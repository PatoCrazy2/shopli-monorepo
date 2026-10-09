import { db, DynamicAudit, DynamicAuditItem, Producto } from "@shopli/db";
import { redirect } from "next/navigation";
import AuditReportClient from "./AuditReportClient";
import { auth } from "@/lib/auth";
import { canAccessDynamicAudits } from "@/lib/check-plan-limits";
import { UpgradeGateBanner } from "@/components/UpgradeGateBanner";

export const dynamic = "force-dynamic";

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.empresa_id) redirect("/login");
  const empresaId = session.user.empresa_id;

  const hasAuditsAccess = await canAccessDynamicAudits(empresaId);
  if (!hasAuditsAccess) {
    redirect("/dashboard/audits");
  }

  const { id } = await params;

  const audit = await db.dynamicAudit.findUnique({
    where: { id },
    include: {
      sucursal: true,
      iniciadaPor: true,
      finalizadaPor: true,
      items: {
        include: {
          producto: {
            include: {
              variants: {
                where: { isActive: true }
              }
            }
          }
        }
      }
    }
  });

  if (!audit || audit.sucursal.empresa_id !== empresaId) {
    redirect("/dashboard/audits");
  }

  // Verificar si la auditoría tuvo reconciliaciones retroactivas (ajustes contables registrados)
  const ajusteCount = await db.movimientoInventario.count({
    where: {
      referencia_id: audit.id,
      tipo: "AJUSTE"
    }
  });

  // Pre-calculate sales during the audit period for context in the view
  // Actually, we already have initialStock, expectedAtCount, and difference.
  // The sales can be derived: Sales = initialStock - expectedAtCount.
  
  // Excluir productos padre (productos base con variantes)
  const filteredItems = audit.items.filter(item => {
    const isParent = item.producto.parent_id == null && item.producto.variants && item.producto.variants.length > 0;
    return !isParent;
  });

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
    items: filteredItems.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.producto.nombre,
      cost: Number(item.producto.costo),
      initialStock: item.initialStock,
      countedQuantity: item.countedQuantity,
      countedAt: item.countedAt ? item.countedAt.toISOString() : null,
      expectedStock: item.expectedAtCount,
      difference: item.difference,
      sales: item.expectedAtCount !== null ? (item.initialStock - item.expectedAtCount) : 0,
    }))
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20">
      <AuditReportClient audit={formattedAudit} />
    </div>
  );
}
