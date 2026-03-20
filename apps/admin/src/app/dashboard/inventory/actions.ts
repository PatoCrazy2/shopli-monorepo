"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function adjustStock(productId: string, amountToAdd: number, reason: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado. Su sesión puede haber expirado." };
  }
  
  const userId = session.user.id;

  try {
    // Tomamos el primer registro existente de inventario para este producto
    // Nota: en futuras implementaciones con múltiples sucursales esto debería
    // tomar explícitamente el sucursal_id.
    const inv = await db.inventario_Sucursal.findFirst({
      where: { producto_id: productId }
    });

    if (!inv) {
      return { error: "No se encontró el inventario activo de este producto." };
    }

    const sucursalId = inv.sucursal_id;

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
