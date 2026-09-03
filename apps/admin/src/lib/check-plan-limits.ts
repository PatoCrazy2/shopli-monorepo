import { db, SubscriptionPlan, SubscriptionStatus } from "@shopli/db";
import { PLAN_CONFIG, getEffectiveSubscription } from "./subscription-plans";

export async function getEmpresaWithSubscription(empresaId: string) {
  const empresa = await db.empresa.findUnique({
    where: { id: empresaId },
    select: {
      id: true,
      nombre: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      gracePeriodEndsAt: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
    },
  });

  if (!empresa) {
    throw new Error("Empresa no encontrada");
  }

  const effective = getEffectiveSubscription(empresa);

  return {
    ...empresa,
    effective,
  };
}

/**
 * Valida si la empresa puede crear un nuevo producto según los límites de su plan.
 */
export async function canAddProduct(empresaId: string) {
  const { effective } = await getEmpresaWithSubscription(empresaId);
  const planConfig = PLAN_CONFIG[effective.plan];

  if (effective.effectiveStatus === SubscriptionStatus.PAST_DUE || effective.effectiveStatus === SubscriptionStatus.UNPAID) {
    return {
      allowed: false,
      reason: "Tu suscripción se encuentra suspendida. Reactiva tu servicio para agregar productos.",
      currentCount: 0,
      maxAllowed: 0,
    };
  }

  if (planConfig.maxProducts === Infinity) {
    return { allowed: true, currentCount: 0, maxAllowed: Infinity };
  }

  const currentCount = await db.producto.count({
    where: {
      empresa_id: empresaId,
      parent_id: null, // Contar productos base (las variantes cuelgan del producto padre)
    },
  });

  if (currentCount >= planConfig.maxProducts) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${planConfig.maxProducts} productos de tu ${planConfig.name}. Actualiza a Plan Crecimiento para catálogo ilimitado.`,
      currentCount,
      maxAllowed: planConfig.maxProducts,
    };
  }

  return { allowed: true, currentCount, maxAllowed: planConfig.maxProducts };
}

/**
 * Valida si la empresa puede crear una nueva sucursal.
 */
export async function canAddBranch(empresaId: string) {
  const { effective } = await getEmpresaWithSubscription(empresaId);
  const planConfig = PLAN_CONFIG[effective.plan];

  if (effective.effectiveStatus === SubscriptionStatus.PAST_DUE || effective.effectiveStatus === SubscriptionStatus.UNPAID) {
    return {
      allowed: false,
      reason: "Tu suscripción se encuentra suspendida. Reactiva tu servicio para administrar sucursales.",
      currentCount: 0,
      maxAllowed: 0,
    };
  }

  const currentCount = await db.sucursal.count({
    where: {
      empresa_id: empresaId,
      activo: true,
    },
  });

  if (currentCount >= planConfig.maxBranches) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${planConfig.maxBranches} sucursal(es) de tu ${planConfig.name}. Actualiza al Plan Multi-Sucursal para operar hasta 3 sucursales.`,
      currentCount,
      maxAllowed: planConfig.maxBranches,
    };
  }

  return { allowed: true, currentCount, maxAllowed: planConfig.maxBranches };
}

/**
 * Valida si la empresa puede registrar un nuevo usuario / cajero.
 */
export async function canAddUser(empresaId: string) {
  const { effective } = await getEmpresaWithSubscription(empresaId);
  const planConfig = PLAN_CONFIG[effective.plan];

  if (effective.effectiveStatus === SubscriptionStatus.PAST_DUE || effective.effectiveStatus === SubscriptionStatus.UNPAID) {
    return {
      allowed: false,
      reason: "Tu suscripción se encuentra suspendida. Reactiva tu servicio para administrar usuarios.",
      currentCount: 0,
      maxAllowed: 0,
    };
  }

  if (planConfig.maxUsers === Infinity) {
    return { allowed: true, currentCount: 0, maxAllowed: Infinity };
  }

  const currentCount = await db.user.count({
    where: {
      empresa_id: empresaId,
      active: true,
    },
  });

  if (currentCount >= planConfig.maxUsers) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${planConfig.maxUsers} usuarios de tu ${planConfig.name}. Actualiza tu plan para registrar más personal.`,
      currentCount,
      maxAllowed: planConfig.maxUsers,
    };
  }

  return { allowed: true, currentCount, maxAllowed: planConfig.maxUsers };
}

/**
 * Valida si la empresa tiene acceso al módulo de analíticas avanzadas.
 */
export async function canAccessAnalytics(empresaId: string): Promise<boolean> {
  const { effective } = await getEmpresaWithSubscription(empresaId);
  const planConfig = PLAN_CONFIG[effective.plan];
  return planConfig.hasAnalytics;
}

/**
 * Valida si la empresa tiene acceso a Auditorías Dinámicas.
 */
export async function canAccessDynamicAudits(empresaId: string): Promise<boolean> {
  const { effective } = await getEmpresaWithSubscription(empresaId);
  const planConfig = PLAN_CONFIG[effective.plan];
  return planConfig.hasDynamicAudits;
}

/**
 * Valida de forma estricta en el servidor si una empresa es elegible para cambiar a un plan inferior (Downgrade).
 * Si los recursos existentes superan los límites del plan de destino, rechaza la operación.
 */
export async function validateDowngradeEligibility(
  empresaId: string,
  targetPlan: SubscriptionPlan,
  client: any = db
): Promise<{ allowed: boolean; reason?: string }> {
  const targetConfig = PLAN_CONFIG[targetPlan];

  // 1. Validar sucursales activas
  const activeBranches = await client.sucursal.count({
    where: { empresa_id: empresaId, activo: true },
  });
  if (activeBranches > targetConfig.maxBranches) {
    return {
      allowed: false,
      reason: `Tienes ${activeBranches} sucursales activas. El ${targetConfig.name} solo permite ${targetConfig.maxBranches}. Debes desactivar las sucursales adicionales antes de cambiarte a este plan.`,
    };
  }

  // 2. Validar productos en catálogo
  if (targetConfig.maxProducts !== Infinity) {
    const productCount = await client.producto.count({
      where: { empresa_id: empresaId, parent_id: null },
    });
    if (productCount > targetConfig.maxProducts) {
      return {
        allowed: false,
        reason: `Tienes ${productCount} productos registrados en tu catálogo. El ${targetConfig.name} solo permite hasta ${targetConfig.maxProducts} productos. Debes reducir tu catálogo antes de cambiarte a este plan.`,
      };
    }
  }

  // 3. Validar usuarios activos
  if (targetConfig.maxUsers !== Infinity) {
    const activeUsers = await client.user.count({
      where: { empresa_id: empresaId, active: true },
    });
    if (activeUsers > targetConfig.maxUsers) {
      return {
        allowed: false,
        reason: `Tienes ${activeUsers} usuarios activos. El ${targetConfig.name} solo permite hasta ${targetConfig.maxUsers} usuarios. Debes desactivar los usuarios excedentes antes de cambiarte a este plan.`,
      };
    }
  }

  return { allowed: true };
}
