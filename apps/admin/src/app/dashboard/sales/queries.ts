import { db } from "@shopli/db";

export async function getSales(filters: { sucursalId?: string; dateStr?: string }) {
  const where: any = {};

  if (filters.sucursalId) {
    where.sucursal_id = filters.sucursalId;
  }

  if (filters.dateStr) {
    const start = new Date(`${filters.dateStr}T00:00:00.000Z`);
    const end = new Date(`${filters.dateStr}T23:59:59.999Z`);
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
