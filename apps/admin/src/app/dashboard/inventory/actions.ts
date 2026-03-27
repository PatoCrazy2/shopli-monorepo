"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function adjustStock(productId: string, amountToAdd: number, reason: string, sucursalId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado. Su sesión puede haber expirado." };
  }
  
  const userId = session.user.id;

  try {
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

      // b) Crear un registro en InventoryAudit documentando el cambio
      // InventoryAudit y AuditItem requieren un ambiente transaccional sobre un "Turno".
      // Crearemos un Turno ficticio/administrativo si el usuario no tiene uno activo 
      // para cumplir con la integridad relacional de Prisma sin modificar el schema.
      let adminTurno = await tx.turno.findFirst({
         where: { usuario_id: userId, sucursal_id: sucursalId, estado: "ABIERTO" }
      });

      if (!adminTurno) {
         adminTurno = await tx.turno.create({
            data: {
               usuario_id: userId,
               sucursal_id: sucursalId,
               estado: "ABIERTO",
               monto_inicial: 0
            }
         });
      }

      // Buscar o crear la auditoría principal ("cabecera") del turno administrativo
      let audit = await tx.inventoryAudit.findFirst({
        where: { turno_id: adminTurno.id, sucursal_id: sucursalId }
      });

      if (!audit) {
        audit = await tx.inventoryAudit.create({
          data: {
            turno_id: adminTurno.id,
            usuario_id: userId,
            sucursal_id: sucursalId
          }
        });
      }

      // Crear el Item de auditoría que refleja el log
      const expectedStock = inv.cantidad; // stock antes del ajuste
      const countedStock = expectedStock + amountToAdd; // nuevo stock simulado/contado

      // Usamos (tx.auditItem as any) para evitar errores TS si 'resolved' es muy reciente
      await (tx.auditItem as any).create({
        data: {
          auditId: audit.id,
          productId,
          expectedStock: expectedStock,
          countedStock: countedStock,
          discrepancy: amountToAdd,
          reason: reason,
          comments: "Ajuste Rápido (Modal UI)",
          resolved: true, // Ya se afectó la base de datos local
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

export async function transferStock(data: { type: 'TRANSFER'|'INGRESS', productId: string, amount: number, fromBranchId?: string, toBranchId: string, reason: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado." };
  
  try {
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
    });

    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error: any) {
    console.error("Error transferStock:", error);
    return { error: error.message || "Error al procesar el movimiento." };
  }
}
