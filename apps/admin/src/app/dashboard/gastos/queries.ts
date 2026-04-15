import { db, Role, GastoCategoria, Prisma } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getGastos(filters: {
  sucursalId?: string;
  startDate?: string;
  endDate?: string;
  categoria?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const where: Prisma.GastoWhereInput = {};

  if (filters.sucursalId) {
    where.sucursal_id = filters.sucursalId;
  }

  if (filters.startDate || filters.endDate) {
    where.fecha = {};
    if (filters.startDate) where.fecha.gte = new Date(filters.startDate);
    if (filters.endDate) where.fecha.lte = new Date(filters.endDate);
  }

  if (filters.categoria) {
    where.categoria = filters.categoria as GastoCategoria;
  }

  try {
    const gastos = await db.gasto.findMany({
      where,
      include: {
        sucursal: {
          select: { nombre: true }
        },
        proveedor: {
          select: { nombre: true }
        }
      },
      orderBy: { fecha: "desc" }
    });

    return gastos;
  } catch (error) {
    console.error("getGastos Error:", error);
    throw new Error("Error al obtener los gastos");
  }
}
