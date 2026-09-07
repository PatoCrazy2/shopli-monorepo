import { NextResponse } from "next/server";
import { db, Role, SubscriptionStatus } from "@shopli/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getEffectiveSubscription } from "@/lib/subscription-plans";
import { getCorsHeaders, handleCorsPreflight } from "@/lib/cors";
import { signPosSyncToken } from "@/lib/pos-token";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type PosAuthResponse = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  empresa_id: string;
  sync_token: string;
  active_shift?: {
    id: string;
    sucursal_id: string;
    monto_inicial: number;
    fecha_apertura: string;
    total_ventas: number;
  } | null;
};

// Validación con Zod: email, PIN de 4 a 6 dígitos numéricos y opcional turnstileToken
const posAuthSchema = z.object({
  email: z.string().email("Email inválido"),
  pin: z.string().min(4, "PIN inválido").max(6, "PIN inválido").regex(/^\d+$/, "PIN inválido"),
  turnstileToken: z.string().optional().nullable(),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  const responseHeaders = new Headers({
    ...corsHeaders,
    "Cache-Control": "no-store",
  });

  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown-ip";

    // 1. Parseo del body
    const body = await req.json().catch(() => ({}));

    // 2. Validación Zod
    const result = posAuthSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Datos inválidos" },
        { status: 400, headers: responseHeaders }
      );
    }

    const { email, pin, turnstileToken } = result.data;

    // 3. Buscar al usuario por email para verificar bloqueo y credenciales
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pin_hash: true,
        empresa_id: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        empresa: {
          select: {
            id: true,
            tokenVersion: true,
            plan: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            gracePeriodEndsAt: true,
            stripeSubscriptionId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401, headers: responseHeaders }
      );
    }

    // 4. Verificar bloqueo persistente a nivel de base de datos
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - now.getTime()) / (60 * 1000)
      );
      return NextResponse.json(
        {
          error: `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente de nuevo en ${minutesRemaining} minutos.`,
        },
        { status: 429, headers: responseHeaders }
      );
    }

    // Si ya expiró el bloqueo, resetear
    if (user.lockedUntil && user.lockedUntil <= now) {
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    // 5. Validar Turnstile si está configurado o si el usuario ha fallado previamente
    if (turnstileToken || user.failedLoginAttempts >= 3) {
      const isTurnstileValid = await verifyTurnstileToken(turnstileToken, ip);
      if (!isTurnstileValid) {
        return NextResponse.json(
          { error: "Verificación de seguridad fallida (Captcha). Por favor, intenta de nuevo." },
          { status: 403, headers: responseHeaders }
        );
      }
    }

    // 6. Validar Rol y Empresa
    if (![Role.CAJERO, Role.ENCARGADO, Role.DUENO].includes(user.role)) {
      return NextResponse.json(
        { error: "Rol sin autorización para operar el terminal POS." },
        { status: 403, headers: responseHeaders }
      );
    }

    if (!user.empresa_id) {
      return NextResponse.json(
        { error: "Usuario sin empresa asignada. Complete el registro en el panel de administración." },
        { status: 403, headers: responseHeaders }
      );
    }

    if (!user.pin_hash) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401, headers: responseHeaders }
      );
    }

    // 7. Comparar PIN con hash
    const match = await bcrypt.compare(pin, user.pin_hash);
    if (!match) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const isNowLocked = newAttempts >= MAX_FAILED_ATTEMPTS;
      const lockedUntilDate = isNowLocked
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        : null;

      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: lockedUntilDate,
        },
      });

      if (isNowLocked) {
        return NextResponse.json(
          {
            error: `Cuenta bloqueada por ${LOCKOUT_MINUTES} minutos debido a múltiples intentos fallidos.`,
          },
          { status: 429, headers: responseHeaders }
        );
      }

      return NextResponse.json(
        {
          error: "Credenciales inválidas",
          attemptsRemaining: MAX_FAILED_ATTEMPTS - newAttempts,
        },
        { status: 401, headers: responseHeaders }
      );
    }

    // Login exitoso: Resetear contador de fallos
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // 8. Validar suscripción SaaS
    if (user.empresa) {
      const effectiveSub = getEffectiveSubscription(user.empresa as any);
      if (
        effectiveSub.effectiveStatus === SubscriptionStatus.PAST_DUE ||
        effectiveSub.effectiveStatus === SubscriptionStatus.UNPAID
      ) {
        return NextResponse.json(
          {
            error: "SUBSCRIPTION_SUSPENDED",
            message:
              "Tu suscripción ha vencido o se encuentra suspendida. Contacta al dueño de la cuenta para reactivar el servicio.",
          },
          { status: 402, headers: responseHeaders }
        );
      }
    }

    // 9. Generar PosSyncToken
    const tokenVersion = user.empresa?.tokenVersion ?? 1;
    const syncToken = signPosSyncToken({
      empresa_id: user.empresa_id,
      user_id: user.id,
      role: user.role,
      tokenVersion,
    });

    // 10. Buscar turno abierto activo
    const activeShift = await db.turno.findFirst({
      where: {
        usuario_id: user.id,
        estado: "ABIERTO",
      },
      orderBy: {
        fecha_apertura: "desc",
      },
      select: {
        id: true,
        sucursal_id: true,
        monto_inicial: true,
        fecha_apertura: true,
        total_ventas: true,
      },
    });

    const responseData: PosAuthResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      empresa_id: user.empresa_id,
      sync_token: syncToken,
      active_shift: activeShift
        ? {
            id: activeShift.id,
            sucursal_id: activeShift.sucursal_id,
            monto_inicial: Number(activeShift.monto_inicial),
            fecha_apertura: activeShift.fecha_apertura.toISOString(),
            total_ventas: Number(activeShift.total_ventas),
          }
        : null,
    };

    return NextResponse.json(responseData, { status: 200, headers: responseHeaders });
  } catch (error) {
    console.error("Error in POST /api/pos/auth:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: responseHeaders }
    );
  }
}
