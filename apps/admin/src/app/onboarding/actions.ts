"use server";

import { db, Role, SubscriptionPlan, SubscriptionStatus } from "@shopli/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const onboardingSchema = z.object({
  businessName: z
    .string()
    .min(2, "El nombre del negocio debe tener al menos 2 caracteres")
    .max(100, "El nombre del negocio es demasiado largo"),
  branchName: z
    .string()
    .min(2, "El nombre de la sucursal debe tener al menos 2 caracteres")
    .max(100, "El nombre de la sucursal es demasiado largo"),
  branchAddress: z.string().optional().nullable(),
});

export async function completeOnboarding(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Debes iniciar sesión para configurar tu tienda." };
  }

  // Si el usuario ya tiene empresa asignada, no duplicar
  if (session.user.empresa_id) {
    return { success: true, empresa_id: session.user.empresa_id };
  }

  const parseResult = onboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    branchName: formData.get("branchName"),
    branchAddress: formData.get("branchAddress") || null,
  });

  if (!parseResult.success) {
    return {
      error: parseResult.error.issues[0]?.message || "Datos inválidos",
      details: parseResult.error.flatten().fieldErrors,
    };
  }

  const { businessName, branchName, branchAddress } = parseResult.data;

  try {
    // 1. Fechas de Free Trial: 14 días completos a nivel Crecimiento + 3 días de gracia
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const gracePeriodEndsAt = new Date(trialEndsAt);
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 3);

    // 2. Transacción atómica: Crear Empresa + Sucursal + Actualizar User
    const result = await db.$transaction(async (tx) => {
      // A. Crear Empresa
      const empresa = await tx.empresa.create({
        data: {
          nombre: businessName.trim(),
          plan: SubscriptionPlan.CRECIMIENTO,
          subscriptionStatus: SubscriptionStatus.TRIALING,
          trialEndsAt,
          gracePeriodEndsAt,
        },
      });

      // B. Crear Sucursal inicial activa
      await tx.sucursal.create({
        data: {
          nombre: branchName.trim(),
          direccion: branchAddress ? branchAddress.trim() : null,
          activo: true,
          empresa_id: empresa.id,
        },
      });

      // C. Actualizar User con la nueva Empresa y rol DUEÑO
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          empresa_id: empresa.id,
          role: Role.DUENO,
        },
      });

      return { empresa_id: empresa.id };
    });

    return { success: true, empresa_id: result.empresa_id };
  } catch (error: any) {
    console.error("Error al completar el onboarding:", error);
    return {
      error: "Ocurrió un error inesperado al configurar tu tienda. Por favor intenta de nuevo.",
    };
  }
}
