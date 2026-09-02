import type Stripe from "stripe";
import { db, SubscriptionPlan, SubscriptionStatus, type Prisma } from "@shopli/db";
import { GRACE_PERIOD_DAYS, mapPriceIdToPlan } from "./subscription-plans";

/**
 * Mapea el estado de una suscripción de Stripe al enum SubscriptionStatus interno,
 * respetando el tiempo restante de gracia si la suscripción se encuentra en past_due.
 */
export function mapStripeStatusToInternal(
  stripeStatus: Stripe.Subscription.Status,
  gracePeriodEndsAt?: Date | null
): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due": {
      const isStillInGrace = gracePeriodEndsAt && new Date() <= new Date(gracePeriodEndsAt);
      return isStillInGrace ? SubscriptionStatus.GRACE_PERIOD : SubscriptionStatus.PAST_DUE;
    }
    case "canceled":
    case "incomplete_expired":
      return SubscriptionStatus.CANCELED;
    case "unpaid":
      return SubscriptionStatus.UNPAID;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.ACTIVE;
  }
}

/**
 * Función central y única de verdad para sincronizar los datos de una suscripción de Stripe
 * hacia la base de datos de ShopLI (tabla Empresa).
 * 
 * ATENCIÓN ARQUITECTÓNICA:
 * Acepta un cliente transaccional opcional `tx`. Toda lectura y escritura a la base de datos
 * se realiza estrictamente a través de `client` (tx ?? db) para garantizar atomicidad e
 * idempotencia en webhooks sin fugas fuera de la transacción de Prisma.
 */
export async function syncEmpresaFromStripeSubscription(
  sub: Stripe.Subscription,
  targetEmpresaId?: string,
  statusOverride?: SubscriptionStatus,
  tx?: Prisma.TransactionClient | typeof db
) {
  const empresaId = targetEmpresaId || sub.metadata?.empresaId;
  if (!empresaId) {
    throw new Error(
      `No se pudo identificar el empresaId para la suscripción de Stripe: ${sub.id}. Verifica metadata.empresaId.`
    );
  }

  // Usar estrictamente el cliente transaccional si fue provisto
  const client = tx ?? db;

  // 1. Obtener estado previo de gracia
  const existing = await client.empresa.findUnique({
    where: { id: empresaId },
    select: { gracePeriodEndsAt: true },
  });

  let gracePeriodEndsAt = existing?.gracePeriodEndsAt ?? null;

  if (sub.status === "past_due" && !gracePeriodEndsAt) {
    // Primer fallo de cobro detectado: fijar días de gracia a partir de hoy
    const d = new Date();
    d.setDate(d.getDate() + GRACE_PERIOD_DAYS);
    gracePeriodEndsAt = d;
  } else if (sub.status === "active") {
    // Cobro exitoso / regularizado: limpiar periodo de gracia
    gracePeriodEndsAt = null;
  }

  // 2. Determinar estado de suscripción (override explícito o mapeo dinámico)
  const subscriptionStatus =
    statusOverride ?? mapStripeStatusToInternal(sub.status, gracePeriodEndsAt);

  // 3. Extraer IDs de ítem, precio y plan de forma segura
  const itemId = sub.items?.data?.[0]?.id ?? null;
  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const planId = (sub.metadata?.planId as SubscriptionPlan) || mapPriceIdToPlan(priceId);

  // 4. Lectura segura de current_period_end (compatible con nuevas y antiguas versiones de Stripe API)
  const periodEndSeconds =
    sub.items?.data?.[0]?.current_period_end ?? (sub as any).current_period_end;
  const currentPeriodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000) : null;

  // 5. Persistencia atómica
  return await client.empresa.update({
    where: { id: empresaId },
    data: {
      plan: planId,
      stripePriceId: priceId,
      stripeSubscriptionId: sub.id,
      stripeSubscriptionItemId: itemId,
      stripeCustomerId: sub.customer as string,
      subscriptionStatus,
      gracePeriodEndsAt,
      currentPeriodEnd,
    },
  });
}
