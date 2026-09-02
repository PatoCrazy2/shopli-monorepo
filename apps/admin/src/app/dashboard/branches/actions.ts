"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canAddBranch } from "@/lib/check-plan-limits";

export async function createSucursal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");

  const check = await canAddBranch(session.user.empresa_id);
  if (!check.allowed) {
    throw new Error(check.reason || "Límite de sucursales alcanzado");
  }

  const nombre = formData.get("nombre") as string;
  const direccion = formData.get("direccion") as string;

  if (!nombre) throw new Error("Nombre es requerido");

  await db.sucursal.create({
    data: {
      nombre,
      direccion,
      empresa_id: session.user.empresa_id,
    },
  });

  revalidatePath("/dashboard/branches");
}

export async function updateSucursal(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  const direccion = formData.get("direccion") as string;

  if (!nombre) throw new Error("Nombre es requerido");

  const sucursal = await db.sucursal.findUnique({
    where: { id },
    select: { empresa_id: true }
  });
  if (!sucursal || sucursal.empresa_id !== session.user.empresa_id) {
    throw new Error("No autorizado");
  }

  await db.sucursal.update({
    where: { id },
    data: {
      nombre,
      direccion,
    },
  });

  revalidatePath("/dashboard/branches");
}

export async function deleteSucursal(id: string) {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");

  const sucursal = await db.sucursal.findUnique({
    where: { id },
    select: { empresa_id: true }
  });
  if (!sucursal || sucursal.empresa_id !== session.user.empresa_id) {
    throw new Error("No autorizado");
  }

  // Borrado lógico para preservar integridad financiera y reportes
  await db.sucursal.update({
    where: { id },
    data: { activo: false }
  });

  revalidatePath("/dashboard/branches");
}
