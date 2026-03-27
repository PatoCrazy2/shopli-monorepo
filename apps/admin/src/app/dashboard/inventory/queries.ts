import { db } from "@shopli/db";

export async function getInventory(sucursalId?: string) {
  const productos = await db.producto.findMany({
    where: { isActive: true }, // Asumiendo que solo queremos activos
    include: {
      inventario: {
        where: sucursalId ? { sucursal_id: sucursalId } : undefined,
        include: {
          sucursal: { select: { nombre: true, id: true } }
        }
      },
      proveedor: { select: { nombre: true } }
    }
  });

  return productos.map(p => {
    const totalStock = p.inventario.reduce((acc, inv) => acc + inv.cantidad, 0);
    return {
      ...p,
      costo: Number(p.costo),
      precio_publico: Number(p.precio_publico),
      totalStock
    }
  }).sort((a, b) => a.totalStock - b.totalStock);
}

export async function getBranches() {
  return await db.sucursal.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc'}
  });
}
