"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canAccessDynamicAudits } from "@/lib/check-plan-limits";

export async function adjustStock(productId: string, amountToAdd: number, reason: string, sucursalId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.empresa_id) {
    return { error: "No autorizado. Su sesión puede haber expirado." };
  }
  const empresaId = session.user.empresa_id;
  const userId = session.user.id;

  try {
    // Validar pertenencia de la sucursal y del producto
    const sucursal = await db.sucursal.findUnique({
      where: { id: sucursalId },
      select: { empresa_id: true }
    });
    if (!sucursal || sucursal.empresa_id !== empresaId) {
      return { error: "No autorizado" };
    }

    const producto = await db.producto.findUnique({
      where: { id: productId },
      select: { empresa_id: true }
    });
    if (!producto || producto.empresa_id !== empresaId) {
      return { error: "No autorizado" };
    }

    let inv = await db.inventario_Sucursal.findUnique({
      where: { sucursal_id_producto_id: { sucursal_id: sucursalId, producto_id: productId } }
    });

    if (!inv) {
      // Si no existe, inicializarlo en 0
      inv = await db.inventario_Sucursal.create({
        data: { sucursal_id: sucursalId, producto_id: productId, cantidad: 0 }
      });
    }

    await db.$transaction(async (tx) => {
      // a) Actualizar el stock del producto usando $increment para seguridad
      await tx.inventario_Sucursal.update({
        where: { id: inv.id },
        data: {
          cantidad: { increment: amountToAdd },
          updatedAt: new Date(),
        }
      });

      // b) Log en MovimientoInventario (Historial Centralizado)
      await tx.movimientoInventario.create({
        data: {
          producto_id: productId,
          sucursal_id: sucursalId,
          cantidad: amountToAdd,
          tipo: "AJUSTE",
          motivo: reason,
          usuario_id: userId,
        }
      });
    });

    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error: any) {
    console.error("Error adjustStock:", error);
    return { error: "Error interno en el servidor al ejecutar el ajuste." };
  }
}

export async function transferStock(data: { type: 'TRANSFER' | 'INGRESS', productId: string, amount: number, fromBranchId?: string, toBranchId: string, reason: string }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.empresa_id) return { error: "No autorizado." };
  const empresaId = session.user.empresa_id;

  try {
    // Validar propiedad del producto
    const producto = await db.producto.findUnique({
      where: { id: data.productId },
      select: { empresa_id: true }
    });
    if (!producto || producto.empresa_id !== empresaId) {
      return { error: "No autorizado" };
    }

    // Validar propiedad de la sucursal destino
    const destSucursal = await db.sucursal.findUnique({
      where: { id: data.toBranchId },
      select: { empresa_id: true }
    });
    if (!destSucursal || destSucursal.empresa_id !== empresaId) {
      return { error: "No autorizado" };
    }

    // Validar sucursal origen si aplica
    if (data.type === 'TRANSFER' && data.fromBranchId) {
      const originSucursal = await db.sucursal.findUnique({
        where: { id: data.fromBranchId },
        select: { empresa_id: true }
      });
      if (!originSucursal || originSucursal.empresa_id !== empresaId) {
        return { error: "No autorizado" };
      }
    }
    await db.$transaction(async (tx) => {
      // Ensure destination inventory exists
      let destInv = await tx.inventario_Sucursal.findUnique({
        where: { sucursal_id_producto_id: { sucursal_id: data.toBranchId, producto_id: data.productId } }
      });
      if (!destInv) {
        destInv = await tx.inventario_Sucursal.create({
          data: { sucursal_id: data.toBranchId, producto_id: data.productId, cantidad: 0 }
        });
      }

      // If transfer, deduct from origin
      if (data.type === 'TRANSFER' && data.fromBranchId) {
        let originInv = await tx.inventario_Sucursal.findUnique({
          where: { sucursal_id_producto_id: { sucursal_id: data.fromBranchId, producto_id: data.productId } }
        });
        if (!originInv || originInv.cantidad < data.amount) {
          throw new Error("Stock insuficiente en la sucursal de origen.");
        }
        await tx.inventario_Sucursal.update({
          where: { id: originInv.id },
          data: { cantidad: { decrement: data.amount }, updatedAt: new Date() }
        });
      }

      // Add to destination
      await tx.inventario_Sucursal.update({
        where: { id: destInv.id },
        data: { cantidad: { increment: data.amount }, updatedAt: new Date() }
      });

      // Log Movements
      const userId = session.user!.id;
      if (data.type === 'TRANSFER' && data.fromBranchId) {
        // Salida de origen
        await tx.movimientoInventario.create({
          data: {
            producto_id: data.productId,
            sucursal_id: data.fromBranchId,
            cantidad: -data.amount,
            tipo: "TRANSFERENCIA_SALIDA",
            motivo: data.reason,
            usuario_id: userId,
            referencia_id: data.toBranchId
          }
        });
        // Entrada a destino
        await tx.movimientoInventario.create({
          data: {
            producto_id: data.productId,
            sucursal_id: data.toBranchId,
            cantidad: data.amount,
            tipo: "TRANSFERENCIA_ENTRADA",
            motivo: data.reason,
            usuario_id: userId,
            referencia_id: data.fromBranchId
          }
        });
      } else {
        // Ingreso directo (Mercancía/Ajuste)
        await tx.movimientoInventario.create({
          data: {
            producto_id: data.productId,
            sucursal_id: data.toBranchId,
            cantidad: data.amount,
            tipo: "INGRESO",
            motivo: data.reason,
            usuario_id: userId
          }
        });
      }
    });

    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error: any) {
    console.error("Error transferStock:", error);
    return { error: error.message || "Error al procesar el movimiento." };
  }
}

/**
 * Crea una nueva auditoría dinámica capturando el snapshot del inventario actual.
 */
export async function createDynamicAudit(sucursalId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.empresa_id) {
    return { error: "No autorizado." };
  }
  const empresaId = session.user.empresa_id;

  try {
    const hasAudits = await canAccessDynamicAudits(empresaId);
    if (!hasAudits) {
      return { error: "Tu plan no incluye Auditorías Dinámicas. Actualiza al Plan Crecimiento." };
    }

    const sucursal = await db.sucursal.findUnique({
      where: { id: sucursalId },
      select: { empresa_id: true }
    });
    if (!sucursal || sucursal.empresa_id !== empresaId) {
      return { error: "No autorizado" };
    }
    const result = await db.$transaction(async (tx) => {
      // 1. Crear la cabecera de la auditoría
      const audit = await tx.dynamicAudit.create({
        data: {
          sucursalId,
          status: "OPEN",
          startedAt: new Date(),
        },
      });

      // 2. Capturar snapshot de stock para TODOS los productos registrados en la sucursal (excluyendo productos padre)
      const branchInventory = await tx.inventario_Sucursal.findMany({
        where: { 
          sucursal_id: sucursalId,
          producto: {
            OR: [
              { parent_id: { not: null } },
              { parent_id: null, variants: { none: {} } }
            ]
          }
        },
        select: {
          producto_id: true,
          cantidad: true,
        },
      });

      // 3. Crear los items de la auditoría con el stock inicial capturado
      if (branchInventory.length > 0) {
        await tx.dynamicAuditItem.createMany({
          data: branchInventory.map((item) => ({
            auditId: audit.id,
            productId: item.producto_id,
            initialStock: item.cantidad,
          })),
        });
      }

      return { success: true, auditId: audit.id };
    });

    revalidatePath("/dashboard/inventory");
    return result;
  } catch (error) {
    console.error("Error creating dynamic audit:", error);
    return { error: "Error al crear la auditoría dinámica." };
  }
}

export async function applyAuditAdjustments(auditId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  try {
    const hasAudits = await canAccessDynamicAudits(empresaId);
    if (!hasAudits) {
      return { error: "Tu plan no incluye Auditorías Dinámicas. Actualiza al Plan Crecimiento." };
    }

    const audit = await db.dynamicAudit.findUnique({
      where: { id: auditId },
      include: { 
        items: true,
        sucursal: { select: { empresa_id: true } }
      }
    });

    if (!audit) throw new Error("Auditoría no encontrada");
    if (audit.sucursal.empresa_id !== empresaId) throw new Error("No autorizado");
    // Ensure that it's closed
    if (audit.status !== 'CLOSED') throw new Error("La auditoría debe estar cerrada para aplicar ajustes.");
    if (audit.isApplied) throw new Error("Los ajustes de esta auditoría ya fueron aplicados.");

    await db.$transaction(async (tx) => {
      // Aplicar cada diferencia al inventario
      for (const item of audit.items) {
        if (item.difference && item.difference !== 0) {
          await tx.inventario_Sucursal.update({
            where: {
              sucursal_id_producto_id: {
                sucursal_id: audit.sucursalId,
                producto_id: item.productId,
              }
            },
            data: {
              cantidad: { increment: item.difference }
            }
          });
        }
      }

      // Marcar como aplicada
      await tx.dynamicAudit.update({
        where: { id: auditId },
        data: { isApplied: true }
      });
    });

    revalidatePath("/dashboard/audits");
    revalidatePath(`/dashboard/audits/${auditId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error applying audit adjustments:", error);
    return { error: error.message || "Error al aplicar los ajustes." };
  }
}
