"use server";

import { db, Role, SubscriptionPlan, SubscriptionStatus } from "@shopli/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { verifyTurnstileToken } from "@/lib/turnstile";

const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres"),
  companyName: z.string().min(1, "El nombre de la empresa es requerido"),
  turnstileToken: z.string().optional().nullable(),
});

export async function registerCompany(formData: FormData) {
  const parseResult = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
    turnstileToken: formData.get("turnstileToken"),
  });

  if (!parseResult.success) {
    return { 
      error: parseResult.error.issues[0]?.message || "Datos inválidos", 
      details: parseResult.error.flatten().fieldErrors 
    };
  }

  const { name, email, password, companyName, turnstileToken } = parseResult.data;

  // Verificación de Turnstile
  const isCaptchaValid = await verifyTurnstileToken(turnstileToken);
  if (!isCaptchaValid) {
    return { error: "Verificación de seguridad fallida (Captcha). Por favor recarga e intenta de nuevo." };
  }

  try {
    // 1. Verificar si el email ya existe
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return { error: "El correo electrónico ya está registrado." };
    }

    // 2. Hashear contraseña
    const pin_hash = await bcrypt.hash(password, 10);

    // Fechas de Free Trial (14 días completos a nivel Crecimiento + 3 días de gracia)
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const gracePeriodEndsAt = new Date(trialEndsAt);
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 3);

    // 3. Crear empresa y usuario en una transacción
    await db.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({
        data: {
          nombre: companyName,
          plan: SubscriptionPlan.CRECIMIENTO,
          subscriptionStatus: SubscriptionStatus.TRIALING,
          trialEndsAt,
          gracePeriodEndsAt,
        },
      });

      await tx.user.create({
        data: {
          name,
          email,
          pin_hash,
          role: Role.DUENO,
          empresa_id: empresa.id,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error al registrar empresa:", error);
    return { error: "Ocurrió un error inesperado al procesar el registro." };
  }
}
