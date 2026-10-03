import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getCuts(sucursalId?: string, date?: string) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  const where: any = {
    sucursal: {
      empresa_id: empresaId
    }
  };

  if (sucursalId) {
    where.sucursal_id = sucursalId;
  }

  if (date) {
    // CDMX es UTC-6. Definimos el inicio y fin del día con offset explícito
    const startDate = new Date(`${date}T00:00:00.000-06:00`);
    const endDate = new Date(`${date}T23:59:59.999-06:00`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return [];
    }

    where.fecha_apertura = {
      gte: startDate,
      lte: endDate,
    };
  }

  return await db.turno.findMany({
    where,
    orderBy: { fecha_apertura: "desc" },
    take: date ? 50 : 20, // Protección de memoria: límite seguro para evitar sobrecarga con relaciones anidadas
    include: {
      usuario: { select: { name: true } },
      sucursal: { select: { nombre: true } },
      ventas: {
        where: { estado: "COMPLETADA" },
        select: { total: true },
      },
      gastos: true,
      auditorias: {
        select: {
          id: true,
          items: {
            where: { discrepancy: { not: 0 } },
            select: {
              id: true,
              discrepancy: true,
              resolved: true,
            },
          },
        },
      },
    },
  });
}
