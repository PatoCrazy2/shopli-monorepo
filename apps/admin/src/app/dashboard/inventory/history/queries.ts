import { db } from "@shopli/db";

export async function getInventoryHistory(branchId?: string, limit = 50) {
  return await db.movimientoInventario.findMany({
    where: branchId ? { sucursal_id: branchId } : {},
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
