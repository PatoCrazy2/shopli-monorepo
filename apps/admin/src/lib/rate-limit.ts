import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

let redis: Redis | null = null;
let pushLimiter: Ratelimit | null = null;
let pullLimiter: Ratelimit | null = null;

/**
 * Obtiene o inicializa la instancia singleton de Redis para Upstash.
 * Si las variables de entorno no existen, retorna null activando el circuit breaker.
 */
function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch (error) {
    console.warn("[RateLimit] Error inicializando cliente Redis Upstash:", error);
    return null;
  }
}

/**
 * Limitador para el endpoint de sincronización Push: 30 peticiones por minuto (Sliding Window).
 */
export function getPushLimiter(): Ratelimit | null {
  if (pushLimiter) return pushLimiter;
  const client = getRedisClient();
  if (!client) return null;

  pushLimiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "shopli:pos:push",
  });
  return pushLimiter;
}

/**
 * Limitador para el endpoint de sincronización Pull: 30 peticiones por minuto (Sliding Window).
 */
export function getPullLimiter(): Ratelimit | null {
  if (pullLimiter) return pullLimiter;
  const client = getRedisClient();
  if (!client) return null;

  pullLimiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "shopli:pos:pull",
  });
  return pullLimiter;
}

export type RateLimitKind = "push" | "pull";

/**
 * Valida el rate limit para un identificador único (ej: user_id del JWT POS).
 *
 * Implementa Circuit Breaker:
 * - Si Upstash no está configurado (ej: entorno local o test), retorna null y deja pasar la petición.
 * - Si Upstash experimenta un fallo de red o tiempo de espera, captura el error, registra un warning
 *   y retorna null para garantizar la continuidad operativa de los cajeros en el POS.
 *
 * @returns NextResponse con HTTP 429 y cabeceras Retry-After si excede el límite, o null si está permitido.
 */
export async function checkRateLimit(
  kind: RateLimitKind,
  identifier: string,
  baseHeaders?: Headers | Record<string, string>
): Promise<NextResponse | null> {
  const limiter = kind === "push" ? getPushLimiter() : getPullLimiter();

  // Circuit Breaker: Si no hay credenciales o limiter configurado, permitir operación
  if (!limiter) {
    return null;
  }

  try {
    const result = await limiter.limit(identifier);

    if (!result.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

      const responseHeaders = new Headers(baseHeaders);
      responseHeaders.set("Retry-After", String(retryAfterSeconds));
      responseHeaders.set("X-RateLimit-Limit", String(result.limit));
      responseHeaders.set("X-RateLimit-Remaining", String(result.remaining));
      responseHeaders.set("X-RateLimit-Reset", String(result.reset));

      return NextResponse.json(
        {
          error: "Demasiadas peticiones de sincronización. Por favor, espere antes de reintentar.",
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: responseHeaders,
        }
      );
    }

    return null;
  } catch (error) {
    // Circuit Breaker: ante cualquier contingencia de Upstash, no bloquear las ventas de la tienda
    console.warn(`[RateLimit] Circuit breaker activado tras error en limitador (${kind}) para ${identifier}:`, error);
    return null;
  }
}
