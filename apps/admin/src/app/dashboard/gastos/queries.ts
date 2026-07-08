import { db, Role, GastoCategoria, Prisma } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getGastos(filters: {
  sucursalId?: string;
  startDate?: string;
  endDate?: string;
  categoria?: string;
}) {
  const session = await auth();
  if (!session?.user?.empresa_id) {
    throw new Error("No autorizado");
  }
  const empresaId = session.user.empresa_id;

  const where: Prisma.GastoWhereInput = {
    sucursal: {
      empresa_id: empresaId
    }
  };

  if (filters.sucursalId) {
    where.sucursal_id = filters.sucursalId;
  }

  if (filters.startDate && filters.endDate) {
    const s = new Date(`${filters.startDate}T00:00:00.000-06:00`);
    const e = new Date(`${filters.endDate}T23:59:59.999-06:00`);
    where.fecha = { gte: s, lte: e };
  } else if (filters.startDate) {
    const s = new Date(`${filters.startDate}T00:00:00.000-06:00`);
    const e = new Date(`${filters.startDate}T23:59:59.999-06:00`);
    where.fecha = { gte: s, lte: e };
  } else if (filters.endDate) {
    where.fecha = { lte: new Date(`${filters.endDate}T23:59:59.999-06:00`) };
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
