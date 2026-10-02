"use server";

import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export async function getInventoryHistory(branchId?: string, limit = 50) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  // Pre-resolver IDs de todas las sucursales de la empresa (conservando historial de sucursales cerradas)
  const sucursales = await db.sucursal.findMany({
    where: { empresa_id: empresaId },
    select: { id: true },
  });
  const sucursalIds = sucursales.map((s) => s.id);

  const where: any = {
    sucursal_id: { in: sucursalIds },
  };

  if (branchId) {
    if (!sucursalIds.includes(branchId)) throw new Error("No autorizado");
    where.sucursal_id = branchId;
  }

  return await db.movimientoInventario.findMany({
    where,
    include: {
      producto: {
        select: { nombre: true, codigo_interno: true },
      },
      sucursal: {
        select: { nombre: true },
      },
      usuario: {
        select: { name: true },
      },
    },
    orderBy: { fecha: "desc" },
    take: limit,
  });
}

export type KardexItem = {
  id: string;
  producto_id: string;
  sucursal_id: string;
  cantidad: number;
  tipo: string;
  motivo: string | null;
  usuario_id: string;
  referencia_id: string | null;
  fecha: string;
  sucursal: {
    nombre: string;
  };
  usuario: {
    name: string | null;
  };
};

/**
 * Consulta diferida (lazy load) de los últimos movimientos específicos de un producto
 * para el panel lateral de Kárdex.
 */
export async function getProductKardex(
  productId: string,
  branchId?: string,
  limit = 20
): Promise<KardexItem[]> {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  // Validar pertenencia del producto a la empresa
  const producto = await db.producto.findUnique({
    where: { id: productId },
    select: { empresa_id: true },
  });

  if (!producto || producto.empresa_id !== empresaId) {
    throw new Error("No autorizado");
  }

  // Pre-resolver IDs de sucursales de la empresa
  const sucursales = await db.sucursal.findMany({
    where: { empresa_id: empresaId },
    select: { id: true },
  });
  const sucursalIds = sucursales.map((s) => s.id);

  if (branchId && !sucursalIds.includes(branchId)) {
    throw new Error("No autorizado");
  }

  const where: any = {
    producto_id: productId,
    sucursal_id: branchId ? branchId : { in: sucursalIds },
  };

  const movimientos = await db.movimientoInventario.findMany({
    where,
    include: {
      sucursal: {
        select: { nombre: true },
      },
      usuario: {
        select: { name: true },
      },
    },
    orderBy: { fecha: "desc" },
    take: limit,
  });

  return movimientos.map((m) => ({
    id: m.id,
    producto_id: m.producto_id,
    sucursal_id: m.sucursal_id,
    cantidad: m.cantidad,
    tipo: m.tipo,
    motivo: m.motivo,
    usuario_id: m.usuario_id,
    referencia_id: m.referencia_id,
    fecha: m.fecha.toISOString(),
    sucursal: {
      nombre: m.sucursal.nombre,
    },
    usuario: {
      name: m.usuario.name,
    },
  }));
}
