"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function resolveAuditItem(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { error: "No autorizado" };
  }

  const id = formData.get("id") as string;
  const reason = formData.get("reason") as string;
  const comments = formData.get("comments") as string;
  const sucursalId = formData.get("sucursalId") as string;

  if (!id || !reason || !sucursalId) {
    return { error: "Faltan datos requeridos" };
  }

  try {
    const item = await db.auditItem.findUnique({ where: { id } });
    
    if (!item) return { error: "Registro no encontrado" };
    // @ts-ignore - Si 'resolved' recién se agregó y TS no ha sincronizado
    if (item.resolved) return { error: "El registro ya se encuentra resuelto" };

    await db.$transaction(async (tx) => {
      // 1. Marcar el item de auditoría como resuelto y guardar justificación
      // Usamos extends o any si el tipo aún no se regenera locamente
      await (tx.auditItem as any).update({
        where: { id },
        data: {
          resolved: true,
          reason,
          comments: comments || null,
        },
      });

      // 2. Ajustar el inventario real al contado por el cajero (countedStock)
      const inventory = await tx.inventario_Sucursal.findUnique({
        where: {
          sucursal_id_producto_id: {
            sucursal_id: sucursalId,
            producto_id: item.productId,
          },
        },
      });

      if (inventory) {
        await tx.inventario_Sucursal.update({
          where: { id: inventory.id },
          data: {
            cantidad: item.countedStock,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.inventario_Sucursal.create({
          data: {
            sucursal_id: sucursalId,
            producto_id: item.productId,
            cantidad: item.countedStock,
          },
        });
      }
    });

    revalidatePath("/dashboard/cuts");
    return { success: true };
  } catch (err: any) {
    console.error("Error resolviendo auditoría:", err);
    return { error: "Ocurrió un error al procesar la resolución en el servidor." };
  }
}
