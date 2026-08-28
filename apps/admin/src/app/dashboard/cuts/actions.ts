"use server";

import { db, Role } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function resolveAuditItem(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresa_id) {
    return { error: "No autorizado" };
  }
  const empresaId = session.user.empresa_id;

  const id = formData.get("id") as string;
  const reason = formData.get("reason") as string;
  const comments = formData.get("comments") as string;
  const sucursalId = formData.get("sucursalId") as string;

  if (!id || !reason || !sucursalId) {
    return { error: "Faltan datos requeridos" };
  }

  // Validar que la sucursal pertenece a la empresa
  const sucursal = await db.sucursal.findUnique({
    where: { id: sucursalId },
    select: { empresa_id: true }
  });
  if (!sucursal || sucursal.empresa_id !== empresaId) {
    return { error: "No autorizado" };
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

export async function forceCloseTurno(turnoId: string) {
  const session = await auth();
  if (!session?.user?.empresa_id || !session?.user?.id) {
    return { error: "No autorizado" };
  }
  const { role, empresa_id } = session.user;

  if (role !== Role.DUENO && role !== Role.ENCARGADO) {
    return { error: "No autorizado: Permisos insuficientes" };
  }

  try {
    const turno = await db.turno.findUnique({
      where: { id: turnoId },
      include: {
        sucursal: { select: { empresa_id: true } }
      }
    });

    if (!turno) {
      return { error: "Turno no encontrado" };
    }

    if (turno.sucursal.empresa_id !== empresa_id) {
      return { error: "No autorizado: El turno pertenece a otra empresa" };
    }

    if (turno.estado === "CERRADO") {
      return { error: "El turno ya se encuentra cerrado" };
    }

    // Calcular el monto final esperado por el sistema (monto_inicial + total_ventas - gastos)
    const initialAmount = Number(turno.monto_inicial);
    const totalSales = Number(turno.total_ventas);
    const gastos = await db.gasto.findMany({
      where: { turno_id: turnoId }
    });
    const totalExpenses = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
    const systemCalculatedFinalAmount = initialAmount + totalSales - totalExpenses;

    await db.turno.update({
      where: { id: turnoId },
      data: {
        estado: "CERRADO",
        fecha_cierre: new Date(),
        monto_final: systemCalculatedFinalAmount
      }
    });

    revalidatePath("/dashboard/cuts");
    return { success: true };
  } catch (error) {
    console.error("Error in forceCloseTurno:", error);
    return { error: "Error interno al forzar el cierre del turno" };
  }
}
