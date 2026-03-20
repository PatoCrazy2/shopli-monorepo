import { db } from "@shopli/db";

export async function getCuts() {
  return await db.turno.findMany({
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
