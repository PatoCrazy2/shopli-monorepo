"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  numero_tel: z.string().optional().nullable(),
  role: z.enum(["ENCARGADO", "CAJERO"]),
  pin: z.string().regex(/^\d{4}$/, "El PIN debe ser de 4 dígitos exactos"),
});

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DUENO") {
    return { error: "No autorizado" };
  }

  const parseResult = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    numero_tel: formData.get("numero_tel") || null,
    role: formData.get("role"),
    pin: formData.get("pin"),
  });

  if (!parseResult.success) {
    return { error: "Datos inválidos", details: parseResult.error.flatten() };
  }

  const data = parseResult.data;

  try {
    const pin_hash = await bcrypt.hash(data.pin, 10);
    
    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        // @ts-ignore - 'numero_tel' exists in db schema now
        numero_tel: data.numero_tel,
        role: data.role,
        pin_hash,
      },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "⚠️ El email ya está en uso" };
    }
    return { error: "Error al crear el usuario en el servidor" };
  }
}

export async function resetPin(id: string, newPin: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DUENO") {
    return { error: "No autorizado" };
  }

  const pinSchema = z.string().regex(/^\d{4}$/, "El PIN debe ser de 4 dígitos exactos");
  const parseResult = pinSchema.safeParse(newPin);

  if (!parseResult.success) {
    return { error: "PIN inválido" };
  }

  try {
    const pin_hash = await bcrypt.hash(parseResult.data, 10);
    await db.user.update({
      where: { id },
      data: {
        pin_hash,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { error: "Error al reiniciar el PIN" };
  }
}

export async function toggleUser(id: string, currentState: boolean, _formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DUENO") {
    throw new Error("No autorizado");
  }
  
  if (session.user.id === id) {
    throw new Error("No puedes desactivar tu propia cuenta");
  }

  try {
    await db.$executeRaw`
      UPDATE "User"
      SET "active" = ${!currentState}, "updatedAt" = NOW()
      WHERE "id" = ${id}
    `;
    revalidatePath("/dashboard/users");
  } catch (error) {
    throw new Error("Error al cambiar el estado del usuario");
  }
}
