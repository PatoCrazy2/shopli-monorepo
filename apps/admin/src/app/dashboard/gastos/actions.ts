"use server";

import { db, Role, GastoCategoria } from "@shopli/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createGasto(data: {
  sucursal_id: string;
  categoria: GastoCategoria;
  monto: number;
  descripcion: string;
  fecha?: string;
  proveedor_id?: string | null;
}) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const role = session.user.role as Role;

  // Validación de seguridad por rol
  if (role === Role.CAJERO && data.categoria !== GastoCategoria.CAJA_CHICA) {
    return { error: "Los cajeros solo pueden registrar gastos de Caja Chica" };
  }

  try {
    const gasto = await db.gasto.create({
      data: {
        sucursal_id: data.sucursal_id,
        categoria: data.categoria,
        monto: data.monto,
        descripcion: data.descripcion,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        proveedor_id: data.proveedor_id || null,
        sync_status: "SYNCED"
      }
    });

    revalidatePath("/dashboard/gastos");
    return { success: true, gasto };
  } catch (error) {
    console.error("createGasto Error:", error);
    return { error: "Error al crear el gasto" };
  }
}

export async function updateGasto(id: string, data: {
  sucursal_id?: string;
  categoria?: GastoCategoria;
  monto?: number;
  descripcion?: string;
  fecha?: string;
  proveedor_id?: string | null;
}) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const role = session.user.role as Role;
  
  if (role === Role.CAJERO) {
    return { error: "Los cajeros no tienen permisos para editar gastos" };
  }

  if (data.categoria && data.categoria !== GastoCategoria.CAJA_CHICA && role !== Role.DUENO && role !== Role.ENCARGADO) {
    return { error: "No tiene permisos para asignar esta categoría" };
  }

  try {
    const updatedGasto = await db.gasto.update({
      where: { id },
      data: {
        ...data,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
      }
    });

    revalidatePath("/dashboard/gastos");
    return { success: true, gasto: updatedGasto };
  } catch (error) {
    console.error("updateGasto Error:", error);
    return { error: "Error al actualizar el gasto" };
  }
}

export async function deleteGasto(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const role = session.user.role as Role;

  if (role !== Role.DUENO && role !== Role.ENCARGADO) {
    return { error: "No tiene permisos para eliminar gastos" };
  }

  try {
    await db.gasto.delete({
      where: { id }
    });

    revalidatePath("/dashboard/gastos");
    return { success: true };
  } catch (error) {
    console.error("deleteGasto Error:", error);
    return { error: "Error al eliminar el gasto" };
  }
}
