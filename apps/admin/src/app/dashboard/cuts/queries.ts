import { db } from "@shopli/db";

export async function getCuts(sucursalId?: string, date?: string) {
  if (!sucursalId) return [];

  const where: any = {
    sucursal_id: sucursalId,
  };

  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    where.fecha_apertura = {
      gte: startDate,
      lte: endDate,
    };
  }

  return await db.turno.findMany({
    where,
    orderBy: { fecha_apertura: "desc" },
    include: {
      usuario: { select: { name: true } },
      sucursal: { select: { nombre: true } },
      ventas: {
        where: { estado: "COMPLETADA" },
        select: { total: true },
      },
      auditorias: {
        include: {
          items: {
            include: {
              producto: { select: { nombre: true, codigo_interno: true } }
            }
          }
        }
      }
    },
  });
}
