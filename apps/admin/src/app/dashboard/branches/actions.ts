"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";

export async function createSucursal(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const direccion = formData.get("direccion") as string;

  if (!nombre) throw new Error("Nombre es requerido");

  await db.sucursal.create({
    data: {
      nombre,
      direccion,
    },
  });

  revalidatePath("/dashboard/branches");
}

export async function updateSucursal(id: string, formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const direccion = formData.get("direccion") as string;

  if (!nombre) throw new Error("Nombre es requerido");

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
  // Borrado lógico para preservar integridad financiera y reportes
  await db.sucursal.update({
    where: { id },
    data: { activo: false }
  });

  revalidatePath("/dashboard/branches");
}
