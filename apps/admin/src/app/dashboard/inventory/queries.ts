import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getInventory(sucursalId?: string) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  // Resolvemos sucursales válidas de la empresa en un viaje (validación RBAC fusionada)
  const branchesQuery = await db.sucursal.findMany({
    where: {
      empresa_id: empresaId,
      activo: true,
      ...(sucursalId ? { id: sucursalId } : {})
    },
    select: { id: true }
  });

  if (sucursalId && branchesQuery.length === 0) {
    throw new Error("No autorizado");
  }
  const branchIds = branchesQuery.map(b => b.id);

  const productos = await db.producto.findMany({
    where: { 
      isActive: true,
      empresa_id: empresaId,
      OR: [
        { parent_id: { not: null } },
        { parent_id: null, variants: { none: {} } }
      ]
    },
    orderBy: { nombre: 'asc' },
    include: {
      inventario: {
        where: { sucursal_id: { in: branchIds } },
        select: {
          sucursal_id: true,
          cantidad: true,
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
  });
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
