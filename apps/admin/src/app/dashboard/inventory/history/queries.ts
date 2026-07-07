import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getInventoryHistory(branchId?: string, limit = 50) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  const where: any = {
    sucursal: {
      empresa_id: empresaId
    }
  };

  if (branchId) {
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
