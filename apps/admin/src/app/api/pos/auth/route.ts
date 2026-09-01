import { NextResponse } from "next/server";
import { db, Role } from "@shopli/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

export type PosAuthResponse = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  empresa_id: string;
  active_shift?: {
    id: string;
    sucursal_id: string;
    monto_inicial: number;
    fecha_apertura: string;
    total_ventas: number;
  } | null;
};

// Validación con Zod: email y PIN de 4 a 6 dígitos numéricos (modo transicional)
const posAuthSchema = z.object({
  email: z.string().email("Email inválido"),
  pin: z.string().min(4, "PIN inválido").max(6, "PIN inválido").regex(/^\d+$/, "PIN inválido"),
});

// Rate limiting básico en memoria
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE",
      "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-pos-sync-secret",
    },
  });
}

export async function POST(req: Request) {
  // Configurar los headers de caché y seguridad
  const responseHeaders = new Headers({
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });

  try {
    // 1. Rate limiting por IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown-ip";
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intente de nuevo más tarde." },
        { status: 429, headers: responseHeaders }
      );
    }

    // 2. Parseo del body
    const body = await req.json().catch(() => ({}));
    
    // 3. Validación Zod
    const result = posAuthSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Datos inválidos" },
        { status: 400, headers: responseHeaders }
      );
    }

    const { email, pin } = result.data;

    // 4. Buscar al usuario específico por email (CAJERO, ENCARGADO, DUENO)
    const user = await db.user.findUnique({
      where: {
        email,
        role: {
          in: [Role.CAJERO, Role.ENCARGADO, Role.DUENO],
        },
      },
      select: {
         id: true,
         name: true,
         email: true,
         role: true,
         pin_hash: true,
         empresa_id: true,
      }
    });

    if (!user || !user.pin_hash) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401, headers: responseHeaders }
      );
    }

    // 5. Comparar el PIN con el hash almacenado
    const match = await bcrypt.compare(pin, user.pin_hash);
    if (!match) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401, headers: responseHeaders }
      );
    }

    // Buscar si el usuario tiene un turno abierto (ordenado por el más reciente)
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
