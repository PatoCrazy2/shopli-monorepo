"use server";

import { db } from "@shopli/db";
import { z } from "zod";
import nodemailer from "nodemailer";
import { verifyTurnstileToken } from "@/lib/turnstile";

const contactSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  email: z.string().email("Ingresa un correo electrónico válido"),
  telefono: z
    .string()
    .max(30, "El número de teléfono es demasiado largo")
    .optional()
    .or(z.literal("")),
  mensaje: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(2000, "El mensaje no puede exceder 2,000 caracteres"),
  turnstileToken: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export async function submitContactMessage(data: ContactFormData) {
  const parseResult = contactSchema.safeParse(data);

  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || "Datos del formulario inválidos.",
    };
  }

  const { nombre, email, telefono, mensaje, turnstileToken } = parseResult.data;

  // 1. Verificación de Seguridad Anti-Bot (Turnstile)
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    console.warn("Bloqueo de seguridad: Envío de contacto falló verificación Turnstile.");
    return {
      success: false,
      error: "No se pudo verificar la prueba de seguridad anti-spam. Intenta de nuevo.",
    };
  }

  try {
    // 2. Guardar en la base de datos
    const savedMessage = await db.contactMessage.create({
      data: {
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        telefono: telefono?.trim() || null,
        mensaje: mensaje.trim(),
      },
    });

    // 2. Intentar enviar correo de notificación si SMTP está configurado
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || smtpUser;

    if (smtpUser && smtpPass && receiverEmail) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b0c10; color: #f3f4f6; border-radius: 12px; border: 1px solid #1f2937;">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px; border-bottom: 1px solid #374151; padding-bottom: 12px;">
              🚀 Nuevo Prospecto de ShopLI
            </h2>
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">
              Has recibido un nuevo mensaje desde el formulario de la landing page.
            </p>
            <div style="background-color: #111827; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #1f2937;">
              <p style="margin: 6px 0;"><strong>Nombre:</strong> <span style="color: #e5e7eb;">${nombre}</span></p>
              <p style="margin: 6px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #60a5fa; text-decoration: none;">${email}</a></p>
              <p style="margin: 6px 0;"><strong>Teléfono:</strong> <span style="color: #e5e7eb;">${telefono || "No especificado"}</span></p>
              <p style="margin: 6px 0;"><strong>ID de Registro:</strong> <code style="color: #9ca3af; font-size: 12px;">${savedMessage.id}</code></p>
            </div>
            <div style="background-color: #111827; padding: 16px; border-radius: 8px; border: 1px solid #1f2937;">
              <h3 style="color: #d1d5db; font-size: 14px; margin-top: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
                Mensaje:
              </h3>
              <p style="color: #f3f4f6; font-size: 15px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${mensaje}</p>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 24px; text-align: center;">
              ShopLI POS Cloud • Notificación Automática de Prospectos
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: `"ShopLI Leads" <${smtpUser}>`,
          to: receiverEmail,
          replyTo: email,
          subject: `[Nuevo Lead] ${nombre} te ha enviado un mensaje`,
          text: `Nuevo mensaje de ${nombre} (${email}, Tel: ${telefono || "N/A"}):\n\n${mensaje}\n\nID: ${savedMessage.id}`,
          html: htmlContent,
        });
      } catch (mailError) {
        // Si falla el envío de correo (ej. contraseña temporalmente inválida o cuota),
        // registramos el error pero no interrumpimos el éxito porque el mensaje ya está en la BD.
        console.error("Aviso: Error enviando email de notificación de lead:", mailError);
      }
    } else {
      console.warn(
        "Aviso: Variables SMTP_USER/SMTP_PASS no configuradas. El mensaje quedó almacenado en la Base de Datos."
      );
    }

    return {
      success: true,
      messageId: savedMessage.id,
    };
  } catch (dbError) {
    console.error("Error al registrar mensaje de contacto en BD:", dbError);
    return {
      success: false,
      error: "Ocurrió un error al enviar tu mensaje. Por favor intenta de nuevo.",
    };
  }
}
