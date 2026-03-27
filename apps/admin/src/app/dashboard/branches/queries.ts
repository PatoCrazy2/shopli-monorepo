import { db } from "@shopli/db";

export async function getSucursales() {
  return await db.sucursal.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });
}
