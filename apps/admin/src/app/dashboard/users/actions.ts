"use server";

import { db } from "@shopli/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { canAddUser } from "@/lib/check-plan-limits";

const userSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  numero_tel: z.string().optional().nullable(),
  role: z.enum(["ENCARGADO", "CAJERO"]),
  pin: z.string().regex(/^\d{6}$/, "El PIN debe ser de 6 dígitos exactos"),
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
    // 0. Validar límite de usuarios de acuerdo al plan de suscripción
    const checkLimit = await canAddUser(session.user.empresa_id);
    if (!checkLimit.allowed) {
      return { error: checkLimit.reason };
    }

    // 1. Validar que el PIN no esté en uso por otro empleado activo en la misma empresa
    const activeUsers = await db.user.findMany({
      where: {
        empresa_id: session.user.empresa_id,
        active: true,
        pin_hash: { not: null },
      },
      select: {
        id: true,
        name: true,
        pin_hash: true,
      },
    });

    for (const u of activeUsers) {
      if (u.pin_hash && (await bcrypt.compare(data.pin, u.pin_hash))) {
        return {
          error: "Este PIN ya está asignado a otro empleado activo en la empresa",
        };
      }
    }

    const pin_hash = await bcrypt.hash(data.pin, 10);
    
    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        // @ts-ignore - 'numero_tel' exists in db schema now
        numero_tel: data.numero_tel,
        role: data.role,
        pin_hash,
        empresa_id: session.user.empresa_id,
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

  const pinSchema = z.string().regex(/^\d{6}$/, "El PIN debe ser de 6 dígitos exactos");
  const parseResult = pinSchema.safeParse(newPin);

  if (!parseResult.success) {
    return { error: "El PIN debe ser de 6 dígitos exactos" };
  }

  try {
    const targetUser = await db.user.findUnique({
      where: { id },
      select: { empresa_id: true }
    });
    if (!targetUser || targetUser.empresa_id !== session.user.empresa_id) {
      return { error: "No autorizado" };
    }

    // Validar que el nuevo PIN no colisione con otro usuario activo de la misma empresa (excluyendo a este usuario)
    const otherActiveUsers = await db.user.findMany({
      where: {
        empresa_id: session.user.empresa_id,
        active: true,
        id: { not: id },
        pin_hash: { not: null },
      },
      select: {
        pin_hash: true,
      },
    });

    for (const u of otherActiveUsers) {
      if (u.pin_hash && (await bcrypt.compare(parseResult.data, u.pin_hash))) {
        return {
          error: "Este PIN ya está asignado a otro empleado activo en la empresa",
        };
      }
    }

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

  const targetUser = await db.user.findUnique({
    where: { id },
    select: { empresa_id: true }
  });
  if (!targetUser || targetUser.empresa_id !== session.user.empresa_id) {
    throw new Error("No autorizado");
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
