import { SubscriptionPlan, SubscriptionStatus } from "@shopli/db";

export const GRACE_PERIOD_DAYS = Number(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS || 3);

export interface PlanPricing {
  amount: number;
  priceId: string;
}

export interface PlanConfigItem {
  id: SubscriptionPlan;
  name: string;
  badge?: string;
  description: string;
  maxProducts: number; // 75 o Infinity para ilimitado
  maxBranches: number; // 1 o 3
  maxUsers: number; // 2, 3 o Infinity
  hasAnalytics: boolean;
  hasDynamicAudits: boolean;
  hasTransfers: boolean;
  prices: {
    monthly: PlanPricing;
    yearly: PlanPricing;
  };
}

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfigItem> = {
  [SubscriptionPlan.ARRANQUE]: {
    id: SubscriptionPlan.ARRANQUE,
    name: "Plan Arranque",
    description: "Ideal para iniciar tu micronegocio con control básico",
    maxProducts: 75,
    maxBranches: 1,
    maxUsers: 2, // 1 Dueño + 1 Cajero
    hasAnalytics: false,
    hasDynamicAudits: false,
    hasTransfers: false,
    prices: {
      monthly: {
        amount: 149,
        priceId: process.env.STRIPE_PRICE_ARRANQUE_MONTHLY || "",
      },
      yearly: {
        amount: 1490,
        priceId: process.env.STRIPE_PRICE_ARRANQUE_YEARLY || "",
      },
    },
  },
  [SubscriptionPlan.CRECIMIENTO]: {
    id: SubscriptionPlan.CRECIMIENTO,
    name: "Plan Crecimiento",
    badge: "Más Popular",
    description: "Para negocios en expansión con catálogo completo y auditorías",
    maxProducts: Infinity,
    maxBranches: 1,
    maxUsers: 3, // 1 Dueño + 2 Cajeros/Encargados
    hasAnalytics: true,
    hasDynamicAudits: true,
    hasTransfers: false,
    prices: {
      monthly: {
        amount: 299,
        priceId: process.env.STRIPE_PRICE_CRECIMIENTO_MONTHLY || "",
      },
      yearly: {
        amount: 2990,
        priceId: process.env.STRIPE_PRICE_CRECIMIENTO_YEARLY || "",
      },
    },
  },
  [SubscriptionPlan.MULTISUCURSAL]: {
    id: SubscriptionPlan.MULTISUCURSAL,
    name: "Plan Multi-Sucursal",
    badge: "Empresarial",
    description: "Gestión centralizada para cadenas con hasta 3 sucursales",
    maxProducts: Infinity,
    maxBranches: 3,
    maxUsers: Infinity,
    hasAnalytics: true,
    hasDynamicAudits: true,
    hasTransfers: true,
    prices: {
      monthly: {
        amount: 599,
        priceId: process.env.STRIPE_PRICE_MULTISUCURSAL_MONTHLY || "",
      },
      yearly: {
        amount: 5990,
        priceId: process.env.STRIPE_PRICE_MULTISUCURSAL_YEARLY || "",
      },
    },
  },
};

/**
 * Mapea un Stripe Price ID a su correspondiente enum SubscriptionPlan.
 */
export function mapPriceIdToPlan(priceId?: string | null): SubscriptionPlan {
  if (!priceId) return SubscriptionPlan.CRECIMIENTO;

  for (const planKey of Object.values(SubscriptionPlan)) {
    const config = PLAN_CONFIG[planKey];
    if (
      (config.prices.monthly.priceId && config.prices.monthly.priceId === priceId) ||
      (config.prices.yearly.priceId && config.prices.yearly.priceId === priceId)
    ) {
      return planKey;
    }
  }

  return SubscriptionPlan.CRECIMIENTO;
}

export interface EffectiveSubscriptionResult {
  effectiveStatus: SubscriptionStatus;
  plan: SubscriptionPlan;
  isExpiringSoon: boolean;
  daysRemaining?: number;
  graceDaysRemaining?: number;
}

/**
 * REGLA DE ORO DE ACCESO Y RESILIENCIA:
 * NUNCA consultar `empresa.subscriptionStatus` directamente en la base de datos para
 * tomar decisiones de negocio o permisos.
 * Esta función evalúa en tiempo real (lazy evaluation) si una empresa está activa,
 * en trial, en periodo de gracia o vencida según las fechas guardadas en Neon.
 */
export function getEffectiveSubscription(empresa: {
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  gracePeriodEndsAt: Date | null;
  stripeSubscriptionId?: string | null;
}): EffectiveSubscriptionResult {
  const now = new Date();

  // CASO 1: Trial Interno (Sin suscripción de Stripe todavía)
  if (!empresa.stripeSubscriptionId) {
    const trialEnd = empresa.trialEndsAt ? new Date(empresa.trialEndsAt) : now;
    const graceEnd = empresa.gracePeriodEndsAt
      ? new Date(empresa.gracePeriodEndsAt)
      : new Date(trialEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    // Todavía dentro de los 14 días de prueba
    if (now <= trialEnd) {
      const diffDays = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        effectiveStatus: SubscriptionStatus.TRIALING,
        plan: empresa.plan,
        isExpiringSoon: diffDays <= 3,
        daysRemaining: Math.max(0, diffDays),
      };
    }

    // Trial venció pero está dentro de los días de gracia
    if (now <= graceEnd) {
      const diffDays = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        effectiveStatus: SubscriptionStatus.GRACE_PERIOD,
        plan: empresa.plan,
        isExpiringSoon: true,
        graceDaysRemaining: Math.max(0, diffDays),
      };
    }

    // Gracia vencida -> Suspensión total
    return {
      effectiveStatus: SubscriptionStatus.PAST_DUE,
      plan: empresa.plan,
      isExpiringSoon: false,
    };
  }

  // CASO 2: Cliente con suscripción de Stripe activa / gestionada
  if (empresa.subscriptionStatus === SubscriptionStatus.GRACE_PERIOD && empresa.gracePeriodEndsAt) {
    const graceEnd = new Date(empresa.gracePeriodEndsAt);
    if (now > graceEnd) {
      return {
        effectiveStatus: SubscriptionStatus.PAST_DUE,
        plan: empresa.plan,
        isExpiringSoon: false,
      };
    }
    const diffDays = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      effectiveStatus: SubscriptionStatus.GRACE_PERIOD,
      plan: empresa.plan,
      isExpiringSoon: true,
      graceDaysRemaining: Math.max(0, diffDays),
    };
  }

  return {
    effectiveStatus: empresa.subscriptionStatus,
    plan: empresa.plan,
    isExpiringSoon: empresa.subscriptionStatus === SubscriptionStatus.GRACE_PERIOD,
  };
}
