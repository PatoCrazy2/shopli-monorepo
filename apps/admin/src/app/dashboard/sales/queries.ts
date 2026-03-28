import { db } from "@shopli/db";

export async function getSales(filters: { sucursalId?: string; dateStr?: string }) {
  if (!filters.sucursalId) return [];
  
  const where: any = {
    sucursal_id: filters.sucursalId
  };

  if (filters.dateStr) {
    // CDMX es UTC-6. Definimos el inicio del día (00:00:00) y fin del día (23:59:59)
    // usando el offset explícito para que Prisma consulte correctamente en UTC.
    const start = new Date(`${filters.dateStr}T00:00:00.000-06:00`);
    const end = new Date(`${filters.dateStr}T23:59:59.999-06:00`);
    where.fecha = { gte: start, lte: end };
  }

  const ventas = await db.venta.findMany({
    where,
    orderBy: { fecha: "desc" },
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
  });

  return ventas;
}

export async function getSucursales() {
  return await db.sucursal.findMany({
    select: { id: true, nombre: true },
  });
}
