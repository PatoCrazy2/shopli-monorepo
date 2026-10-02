import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getInventoryHistory(branchId?: string, limit = 50) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  // Pre-resolver IDs de todas las sucursales de la empresa (conservando historial de sucursales cerradas)
  const sucursales = await db.sucursal.findMany({
    where: { empresa_id: empresaId },
    select: { id: true }
  });
  const sucursalIds = sucursales.map(s => s.id);

  const where: any = {
    sucursal_id: { in: sucursalIds }
  };

  if (branchId) {
    if (!sucursalIds.includes(branchId)) throw new Error("No autorizado");
    where.sucursal_id = branchId;
  }

  return await db.movimientoInventario.findMany({
    where,
    include: {
      producto: {
        select: { nombre: true, codigo_interno: true }
      },
      sucursal: {
        select: { nombre: true }
      },
      usuario: {
        select: { name: true }
      }
    },
    orderBy: { fecha: "desc" },
    take: limit
  });
}
