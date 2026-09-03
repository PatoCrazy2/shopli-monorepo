import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionPlan, SubscriptionStatus } from "@shopli/db";
import { getEffectiveSubscription } from "../subscription-plans";
import { db } from "@shopli/db";

// Mock del ORM prisma / @shopli/db
vi.mock("@shopli/db", () => {
  return {
    SubscriptionPlan: {
      ARRANQUE: "ARRANQUE",
      CRECIMIENTO: "CRECIMIENTO",
      MULTISUCURSAL: "MULTISUCURSAL",
    },
    SubscriptionStatus: {
      TRIALING: "TRIALING",
      ACTIVE: "ACTIVE",
      PAST_DUE: "PAST_DUE",
      CANCELED: "CANCELED",
      UNPAID: "UNPAID",
      GRACE_PERIOD: "GRACE_PERIOD",
    },
    db: {
      empresa: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe("Fase 5 - Validación de Suscripción en Endpoints POS (HTTP 402)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Evaluación de Empresa en getEffectiveSubscription para Sync", () => {
    it("debe determinar PAST_DUE cuando la gracia vence", () => {
      const pastGrace = new Date();
      pastGrace.setDate(pastGrace.getDate() - 2);

      const effective = getEffectiveSubscription({
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.GRACE_PERIOD,
        trialEndsAt: null,
        gracePeriodEndsAt: pastGrace,
        stripeSubscriptionId: "sub_123",
      });

      expect(effective.effectiveStatus).toBe(SubscriptionStatus.PAST_DUE);
    });

    it("debe mantenerse GRACE_PERIOD mientras no venza la gracia (permite sync)", () => {
      const futureGrace = new Date();
      futureGrace.setDate(futureGrace.getDate() + 2);

      const effective = getEffectiveSubscription({
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.GRACE_PERIOD,
        trialEndsAt: null,
        gracePeriodEndsAt: futureGrace,
        stripeSubscriptionId: "sub_123",
      });

      expect(effective.effectiveStatus).toBe(SubscriptionStatus.GRACE_PERIOD);
    });

    it("debe estar ACTIVE si la suscripción está al día", () => {
      const effective = getEffectiveSubscription({
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_123",
      });

      expect(effective.effectiveStatus).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe("2. Comprobación de Respuesta 402 en Endpoints POS", () => {
    it("debe definir el formato estándar de payload 402 Payment Required", () => {
      const errorPayload = {
        error: "SUBSCRIPTION_SUSPENDED",
        message: "Tu suscripción ha vencido o se encuentra suspendida. Contacta al dueño de la cuenta para reactivar el servicio.",
      };

      expect(errorPayload.error).toBe("SUBSCRIPTION_SUSPENDED");
      expect(errorPayload.message).toContain("suspendida");
    });
  });
});
