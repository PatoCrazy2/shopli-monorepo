import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getSales(filters: { sucursalId?: string; dateStr?: string }) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  if (!filters.sucursalId) return [];
  
  // Validamos que la sucursal pertenezca a la empresa
  const sucursal = await db.sucursal.findUnique({
    where: { id: filters.sucursalId },
    select: { empresa_id: true }
  });
  if (!sucursal || sucursal.empresa_id !== empresaId) {
    throw new Error("No autorizado");
  }
  
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
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");

  return await db.sucursal.findMany({
    where: { 
      activo: true,
      empresa_id: session.user.empresa_id
    },
    select: { id: true, nombre: true },
  });
}
