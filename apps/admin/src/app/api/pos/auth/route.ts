import { NextResponse } from "next/server";
import { db, Role } from "@shopli/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Tipos exportados solicitados
export type PosAuthResponse = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

// Validación con Zod: PIN de 4 dígitos numéricos exactos
const posAuthSchema = z.object({
  pin: z.string().length(4, "PIN inválido").regex(/^\d+$/, "PIN inválido"),
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

export async function POST(req: Request) {
  // Configurar los headers de caché y seguridad
  const responseHeaders = new Headers({
    "Cache-Control": "no-store",
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
        { error: "PIN inválido" },
        { status: 401, headers: responseHeaders }
      );
    }

    const { pin } = result.data;

    // 4. Buscar en la base de datos a los usuarios con rol CAJERO o ENCARGADO
    // Nota: El modelo de Base de Datos actual no cuenta con campo "status" ni "isActive".
    // Si se agrega en el futuro, debería agregarse un filtro de tipo `isActive: true` aquí.
    const users = await db.user.findMany({
      where: {
        role: {
          in: [Role.CAJERO, Role.ENCARGADO],
        },
      },
      select: {
         id: true,
         name: true,
         email: true,
         role: true,
         pin_hash: true,
         // status: true // <- Descomentar si se agrega status en DB para el if posterior de status 403
      }
    });

    // 5. Comparar el PIN con los hashes almacenados
    for (const user of users) {
      if (user.pin_hash) {
        const match = await bcrypt.compare(pin, user.pin_hash);
        
        if (match) {
          // Chequeo de estatus inactivo (Comentado porque falta en base de datos)
          // if (!user.status || user.status !== 'ACTIVO') {
          //   return NextResponse.json(
          //     { error: "Usuario deshabilitado" },
          //     { status: 403, headers: responseHeaders }
          //   );
          // }

          const responseData: PosAuthResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
          
          return NextResponse.json(responseData, { status: 200, headers: responseHeaders });
        }
      }
    }

    // 6. Ningún hash coincidió
    // No revelamos si el usuario existe o si es el error genérico
    return NextResponse.json(
      { error: "PIN inválido" },
      { status: 401, headers: responseHeaders }
    );
  } catch (error) {
    console.error("Error in POST /api/pos/auth:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: responseHeaders }
    );
  }
}
