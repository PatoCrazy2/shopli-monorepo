"use server";

import { db, Role } from "@shopli/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkEmailMxRecord, checkPasswordRules } from "@/lib/validators/auth";

const registerUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  turnstileToken: z.string().optional().nullable(),
});

export async function registerUser(formData: FormData) {
  const parseResult = registerUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    turnstileToken: formData.get("turnstileToken"),
  });

  if (!parseResult.success) {
    return {
      error: parseResult.error.issues[0]?.message || "Datos inválidos",
      details: parseResult.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, turnstileToken } = parseResult.data;

  // 1. Validar entregabilidad y dominio de correo profesionalmente (DNS MX Records)
  const mxCheck = await checkEmailMxRecord(email);
  if (!mxCheck.valid) {
    return {
      error: mxCheck.reason || "Por favor ingresa un correo electrónico corporativo o personal válido.",
    };
  }

  // 2. Validar reglas de contraseña
  const passwordCheck = checkPasswordRules(password);
  if (!passwordCheck.isValid) {
    return {
      error: "La contraseña no cumple con los requisitos mínimos (8 caracteres, 1 número y 1 letra).",
    };
  }

  // 3. Verificación de Turnstile (si está presente)
  const isCaptchaValid = await verifyTurnstileToken(turnstileToken);
  if (!isCaptchaValid) {
    return {
      error: "Verificación de seguridad fallida (Captcha). Por favor recarga e intenta de nuevo.",
    };
  }

  try {
    // 4. Verificar si el email ya existe
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "El correo electrónico ya está registrado." };
    }

    // 5. Hashear contraseña
    const pin_hash = await bcrypt.hash(password, 10);

    // 6. Crear usuario con rol DUEÑO y empresa_id: null (a completar en el asistente de onboarding)
    await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        pin_hash,
        role: Role.DUENO,
        empresa_id: null,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error al registrar usuario:", error);
    return { error: "Ocurrió un error inesperado al procesar el registro." };
  }
}

