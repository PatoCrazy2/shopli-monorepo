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
  if (!session?.user?.empresa_id) return { error: "No autorizado" };
  const empresaId = session.user.empresa_id;

  const role = session.user.role as Role;

  // Validación de seguridad por rol
  if (role === Role.CAJERO && data.categoria !== GastoCategoria.CAJA_CHICA) {
    return { error: "Los cajeros solo pueden registrar gastos de Caja Chica" };
  }

  // Validar pertenencia de la sucursal
  const sucursal = await db.sucursal.findUnique({
    where: { id: data.sucursal_id },
    select: { empresa_id: true }
  });
  if (!sucursal || sucursal.empresa_id !== empresaId) {
    return { error: "No autorizado" };
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
  if (!session?.user?.empresa_id) return { error: "No autorizado" };
  const empresaId = session.user.empresa_id;

  const role = session.user.role as Role;
  
  if (role === Role.CAJERO) {
    return { error: "Los cajeros no tienen permisos para editar gastos" };
  }

  if (data.categoria && data.categoria !== GastoCategoria.CAJA_CHICA && role !== Role.DUENO && role !== Role.ENCARGADO) {
    return { error: "No tiene permisos para asignar esta categoría" };
  }

  // Validar propiedad del gasto existente
  const existingGasto = await db.gasto.findUnique({
    where: { id },
    include: { sucursal: true }
  });
  if (!existingGasto || existingGasto.sucursal.empresa_id !== empresaId) {
    return { error: "No autorizado" };
  }

  // Si se cambia de sucursal, validar que la nueva sucursal pertenezca a la empresa
  if (data.sucursal_id) {
    const sucursal = await db.sucursal.findUnique({
      where: { id: data.sucursal_id },
      select: { empresa_id: true }
    });
    if (!sucursal || sucursal.empresa_id !== empresaId) {
      return { error: "No autorizado" };
    }
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
  if (!session?.user?.empresa_id) return { error: "No autorizado" };
  const empresaId = session.user.empresa_id;

  const role = session.user.role as Role;

  if (role !== Role.DUENO && role !== Role.ENCARGADO) {
    return { error: "No tiene permisos para eliminar gastos" };
  }

  // Validar propiedad del gasto existente
  const existingGasto = await db.gasto.findUnique({
    where: { id },
    include: { sucursal: true }
  });
  if (!existingGasto || existingGasto.sucursal.empresa_id !== empresaId) {
    return { error: "No autorizado" };
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
