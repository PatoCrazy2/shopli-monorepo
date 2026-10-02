"use server";

import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export interface InventoryHistoryFilter {
  branchId?: string;
  type?: "ALL" | "IN" | "OUT" | "TRANSFER";
  period?: "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "ALL";
  search?: string;
  limit?: number;
  cursor?: string;
}

export type HistoryMovementItem = {
  id: string;
  producto_id: string;
  sucursal_id: string;
  cantidad: number;
  tipo: string;
  motivo: string | null;
  usuario_id: string;
  referencia_id: string | null;
  fecha: string;
  producto: {
    nombre: string;
    codigo_interno: string | null;
  };
  sucursal: {
    nombre: string;
  };
  usuario: {
    name: string | null;
  };
};

export async function getInventoryHistory(
  options?: InventoryHistoryFilter | string,
  limitParam = 100
): Promise<HistoryMovementItem[]> {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  // Soporte para firma antigua (branchId?: string, limit?: number) y nueva (options object)
  const opts: InventoryHistoryFilter =
    typeof options === "string"
      ? { branchId: options, limit: limitParam }
      : options || { limit: limitParam };

  const { branchId, type = "ALL", period = "ALL", search, limit = 100, cursor } = opts;

  // Pre-resolver IDs de todas las sucursales de la empresa
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

  // Filtro por Tipo de Movimiento
  if (type === "IN") {
    where.tipo = { in: ["INGRESO", "TRANSFERENCIA_ENTRADA"] };
  } else if (type === "OUT") {
    where.tipo = { in: ["EGRESO", "AJUSTE", "TRANSFERENCIA_SALIDA"] };
  } else if (type === "TRANSFER") {
    where.tipo = { in: ["TRANSFERENCIA_ENTRADA", "TRANSFERENCIA_SALIDA"] };
  }

  // Filtro por Período de Fecha
  if (period && period !== "ALL") {
    const now = new Date();
    let startDate: Date;
    let endDate: Date | undefined;

    if (period === "TODAY") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === "YESTERDAY") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (period === "LAST_7_DAYS") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "LAST_30_DAYS") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(0);
    }

    where.fecha = endDate ? { gte: startDate, lte: endDate } : { gte: startDate };
  }

  // Filtro por Búsqueda de Producto o SKU
  if (search && search.trim()) {
    const term = search.trim();
    where.producto = {
      OR: [
        { nombre: { contains: term, mode: "insensitive" } },
        { codigo_interno: { contains: term, mode: "insensitive" } },
      ],
    };
  }

  const rows = await db.movimientoInventario.findMany({
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
    ...(cursor
      ? {
          skip: 1,
          cursor: {
            id: cursor,
          },
        }
      : {}),
  });

  return rows.map((m) => ({
    id: m.id,
    producto_id: m.producto_id,
    sucursal_id: m.sucursal_id,
    cantidad: m.cantidad,
    tipo: m.tipo,
    motivo: m.motivo,
    usuario_id: m.usuario_id,
    referencia_id: m.referencia_id,
    fecha: m.fecha.toISOString(),
    producto: {
      nombre: m.producto.nombre,
      codigo_interno: m.producto.codigo_interno,
    },
    sucursal: {
      nombre: m.sucursal.nombre,
    },
    usuario: {
      name: m.usuario.name,
    },
  }));
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
