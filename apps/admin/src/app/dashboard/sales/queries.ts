import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

const PAGE_SIZE = 50;

export async function getSales(filters: {
  sucursalId?: string;
  dateStr?: string;
  page?: number;
}) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
    throw new Error("No tienes permisos para consultar ventas");
  }
  const empresaId = session.user.empresa_id;

  if (!filters.sucursalId) {
    return { ventas: [], total: 0, page: 1, pageSize: PAGE_SIZE };
  }

  const page = Math.max(1, filters.page ?? 1);

  const where: any = {
    sucursal_id: filters.sucursalId,
    sucursal: { empresa_id: empresaId },
  };

  if (filters.dateStr) {
    // CDMX es UTC-6. Definimos el inicio del día (00:00:00) y fin del día (23:59:59)
    // usando el offset explícito para que Prisma consulte correctamente en UTC.
    const start = new Date(`${filters.dateStr}T00:00:00.000-06:00`);
    const end = new Date(`${filters.dateStr}T23:59:59.999-06:00`);
    where.fecha = { gte: start, lte: end };
  }

  const [ventas, total] = await Promise.all([
    db.venta.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        turno: {
          include: {
            usuario: {
              select: { name: true, id: true },
            },
          },
        },
        detalles: {
          include: {
            producto: { select: { nombre: true } },
          },
        },
      },
    }),
    db.venta.count({ where }),
  ]);

  return { ventas, total, page, pageSize: PAGE_SIZE };
}

export async function getSucursales() {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
    throw new Error("No tienes permisos para consultar sucursales");
  }

  return await db.sucursal.findMany({
    where: { 
      activo: true,
      empresa_id: session.user.empresa_id
    },
    select: { id: true, nombre: true },
  });
}
