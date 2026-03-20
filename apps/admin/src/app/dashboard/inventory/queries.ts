import { db } from "@shopli/db";

export async function getInventory() {
  const productos = await db.producto.findMany({
    where: { isActive: true }, // Asumiendo que solo queremos activos
    include: {
      inventario: {
        include: {
          sucursal: { select: { nombre: true } }
        }
      },
      proveedor: { select: { nombre: true } }
    }
  });

  return productos.map(p => {
    const totalStock = p.inventario.reduce((acc, inv) => acc + inv.cantidad, 0);
    return {
      ...p,
      totalStock
    }
  }).sort((a, b) => a.totalStock - b.totalStock);
}
