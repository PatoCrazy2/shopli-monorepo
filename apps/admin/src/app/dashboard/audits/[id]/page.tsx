import { db, DynamicAudit, DynamicAuditItem, Producto } from "@shopli/db";
import { redirect } from "next/navigation";
import AuditReportClient from "./AuditReportClient";

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const audit = await db.dynamicAudit.findUnique({
    where: { id },
    include: {
      sucursal: true,
      items: {
        include: {
          producto: true
        }
      }
    }
  });

  if (!audit) {
    redirect("/dashboard/inventory");
  }

  // Pre-calculate sales during the audit period for context in the view
  // Actually, we already have initialStock, expectedAtCount, and difference.
  // The sales can be derived: Sales = initialStock - expectedAtCount.
  
  const formattedAudit = {
    id: audit.id,
    branchName: audit.sucursal.nombre,
    status: audit.status,
    isApplied: audit.isApplied,
    startedAt: audit.startedAt.toISOString(),
    items: audit.items.map(item => ({
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
    <div className="flex-1 w-full flex flex-col p-8 bg-zinc-50 border-s border-zinc-200">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Reporte de Auditoría</h1>
            <p className="text-zinc-500 mt-2 text-sm">
                Sucursal: <span className="font-medium text-zinc-700">{formattedAudit.branchName}</span> &middot; 
                Iniciada: {new Date(formattedAudit.startedAt).toLocaleString()} &middot;
                Estado: {formattedAudit.status === 'OPEN' ? 'En Curso (Conteo Abierto)' : 'Cerrada (Conteo Finalizado)'}
            </p>
         </div>
      </div>
      
      <AuditReportClient audit={formattedAudit} />
    </div>
  );
}
