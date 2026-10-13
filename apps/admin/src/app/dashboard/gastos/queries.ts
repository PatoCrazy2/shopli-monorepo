import { db, GastoCategoria, Prisma } from "@shopli/db";
import { auth } from "@/lib/auth";

export const EXPENSES_PAGE_SIZE = 25;

export interface GastosFilters {
  sucursalId?: string;
  startDate?: string;
  endDate?: string;
  categoria?: string;
  page?: number;
  pageSize?: number;
}

export async function getGastos(filters: GastosFilters) {
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

  const pageSize = filters.pageSize || EXPENSES_PAGE_SIZE;
  const page = Math.max(1, filters.page || 1);
  const skip = (page - 1) * pageSize;

  try {
    const [gastos, total, allMatchingMetrics] = await Promise.all([
      db.gasto.findMany({
        where,
        include: {
          sucursal: {
            select: { nombre: true }
          },
          proveedor: {
            select: { nombre: true }
          }
        },
        orderBy: { fecha: "desc" },
        take: pageSize,
        skip,
      }),
      db.gasto.count({ where }),
      db.gasto.findMany({
        where,
        select: {
          monto: true,
          categoria: true,
        }
      })
    ]);

    const totalGastos = allMatchingMetrics.reduce((sum, g) => sum + Number(g.monto), 0);
    const nominalGastos = allMatchingMetrics.filter(g => g.categoria === "NOMINA").reduce((sum, g) => sum + Number(g.monto), 0);
    const localGastos = allMatchingMetrics.filter(g => g.categoria === "RENTA").reduce((sum, g) => sum + Number(g.monto), 0);
    const otrosGastos = totalGastos - nominalGastos - localGastos;

    return {
      gastos,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      metrics: {
        totalGastos,
        nominalGastos,
        localGastos,
        otrosGastos,
        count: total,
      }
    };
  } catch (error) {
    console.error("getGastos Error:", error);
    throw new Error("Error al obtener los gastos");
  }
}
