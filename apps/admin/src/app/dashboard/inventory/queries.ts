import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getInventory(sucursalId?: string) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  if (sucursalId) {
    const sucursal = await db.sucursal.findUnique({
      where: { id: sucursalId },
      select: { empresa_id: true }
    });
    if (!sucursal || sucursal.empresa_id !== empresaId) {
      throw new Error("No autorizado");
    }
  }

  const productos = await db.producto.findMany({
    where: { 
      isActive: true,
      empresa_id: empresaId,
      OR: [
        { parent_id: { not: null } },
        { parent_id: null, variants: { none: {} } }
      ]
    },
    include: {
      inventario: {
        where: sucursalId ? { sucursal_id: sucursalId } : { sucursal: { empresa_id: empresaId } },
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
      precio_mayoreo: p.precio_mayoreo ? Number(p.precio_mayoreo) : null,
      totalStock
    }
  }).sort((a, b) => a.totalStock - b.totalStock);
}

export async function getBranches() {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");

  return await db.sucursal.findMany({
    where: { 
      activo: true, 
      empresa_id: session.user.empresa_id 
    },
    orderBy: { nombre: 'asc'}
  });
}
