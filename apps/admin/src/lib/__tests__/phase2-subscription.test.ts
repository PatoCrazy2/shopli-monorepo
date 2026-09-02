import { describe, it, expect, vi } from "vitest";
import { SubscriptionPlan, SubscriptionStatus } from "@shopli/db";
import {
  mapStripeStatusToInternal,
  syncEmpresaFromStripeSubscription,
} from "../stripe-sync";
import {
  getEffectiveSubscription,
  mapPriceIdToPlan,
  PLAN_CONFIG,
  GRACE_PERIOD_DAYS,
} from "../subscription-plans";
import { validateDowngradeEligibility } from "../check-plan-limits";
import { db } from "@shopli/db";

describe("Fase 2 - Pruebas Unitarias de Suscripciones y Stripe", () => {
  describe("1. mapStripeStatusToInternal", () => {
    it("debe mapear 'active' a ACTIVE", () => {
      expect(mapStripeStatusToInternal("active")).toBe(SubscriptionStatus.ACTIVE);
    });

    it("debe mapear 'past_due' a GRACE_PERIOD si la fecha de gracia está en el futuro", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      expect(mapStripeStatusToInternal("past_due", futureDate)).toBe(
        SubscriptionStatus.GRACE_PERIOD
      );
    });

    it("debe mapear 'past_due' a PAST_DUE si la fecha de gracia ya venció", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(mapStripeStatusToInternal("past_due", pastDate)).toBe(
        SubscriptionStatus.PAST_DUE
      );
    });

    it("debe mapear 'canceled' e 'incomplete_expired' a CANCELED", () => {
      expect(mapStripeStatusToInternal("canceled")).toBe(SubscriptionStatus.CANCELED);
      expect(mapStripeStatusToInternal("incomplete_expired")).toBe(
        SubscriptionStatus.CANCELED
      );
    });

    it("debe mapear 'unpaid' a UNPAID", () => {
      expect(mapStripeStatusToInternal("unpaid")).toBe(SubscriptionStatus.UNPAID);
    });

    it("debe mapear 'trialing' a TRIALING", () => {
      expect(mapStripeStatusToInternal("trialing")).toBe(SubscriptionStatus.TRIALING);
    });
  });

  describe("2. getEffectiveSubscription (Evaluación Perezosa Universal)", () => {
    it("CASO 1 (Trial Interno): debe estar en TRIALING si trialEndsAt es futuro", () => {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 10);

      const res = getEffectiveSubscription({
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: null,
      });

      expect(res.effectiveStatus).toBe(SubscriptionStatus.TRIALING);
      expect(res.daysRemaining).toBe(10);
      expect(res.isExpiringSoon).toBe(false);
    });

    it("CASO 1 (Trial Interno): debe marcar isExpiringSoon = true si quedan 3 días o menos", () => {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 2);

      const res = getEffectiveSubscription({
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: null,
      });

      expect(res.effectiveStatus).toBe(SubscriptionStatus.TRIALING);
      expect(res.daysRemaining).toBe(2);
      expect(res.isExpiringSoon).toBe(true);
    });

    it("CASO 1 (Trial Interno): si vence trial pero está en gracia, pasa a GRACE_PERIOD", () => {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() - 1); // venció ayer

      const gracePeriodEndsAt = new Date();
      gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 2); // le quedan 2 días de gracia

      const res = getEffectiveSubscription({
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt,
        gracePeriodEndsAt,
        stripeSubscriptionId: null,
      });

      expect(res.effectiveStatus).toBe(SubscriptionStatus.GRACE_PERIOD);
      expect(res.graceDaysRemaining).toBe(2);
      expect(res.isExpiringSoon).toBe(true);
    });

    it("CASO 1 (Trial Interno): si vence la gracia, pasa inmediatamente a PAST_DUE", () => {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() - 5);

      const gracePeriodEndsAt = new Date();
      gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() - 1);

      const res = getEffectiveSubscription({
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt,
        gracePeriodEndsAt,
        stripeSubscriptionId: null,
      });

      expect(res.effectiveStatus).toBe(SubscriptionStatus.PAST_DUE);
      expect(res.isExpiringSoon).toBe(false);
    });

    it("CASO 2 (Cliente Stripe): si status en DB es GRACE_PERIOD y gracePeriodEndsAt ya pasó, pasa a PAST_DUE sin esperar webhooks", () => {
      const gracePeriodEndsAt = new Date();
      gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() - 1); // gracia venció ayer

      const res = getEffectiveSubscription({
        plan: SubscriptionPlan.ARRANQUE,
        subscriptionStatus: SubscriptionStatus.GRACE_PERIOD,
        trialEndsAt: null,
        gracePeriodEndsAt,
        stripeSubscriptionId: "sub_123456",
      });

      // Prueba de oro: aunque subscriptionStatus en DB diga GRACE_PERIOD, el efectivo es PAST_DUE
      expect(res.effectiveStatus).toBe(SubscriptionStatus.PAST_DUE);
      expect(res.isExpiringSoon).toBe(false);
    });

    it("CASO 2 (Cliente Stripe): si status es ACTIVE, se mantiene ACTIVE", () => {
      const res = getEffectiveSubscription({
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_123456",
      });

      expect(res.effectiveStatus).toBe(SubscriptionStatus.ACTIVE);
      expect(res.isExpiringSoon).toBe(false);
    });
  });

  describe("3. mapPriceIdToPlan", () => {
    it("debe mapear correctamente los planes por defecto", () => {
      expect(mapPriceIdToPlan(null)).toBe(SubscriptionPlan.CRECIMIENTO);
      expect(mapPriceIdToPlan("price_inexistente")).toBe(SubscriptionPlan.CRECIMIENTO);
    });
  });

  describe("4. syncEmpresaFromStripeSubscription (Uso estricto de tx y persistencia)", () => {
    it("debe usar tx para todas las consultas y escrituras sin saltarse la transacción", async () => {
      const mockFindUnique = vi.fn().mockResolvedValue({ gracePeriodEndsAt: null });
      const mockUpdate = vi.fn().mockResolvedValue({ id: "emp_123" });

      const mockTx = {
        empresa: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      } as any;

      const mockSub = {
        id: "sub_test_123",
        status: "active",
        customer: "cus_test_123",
        items: {
          data: [
            {
              id: "si_item_123",
              price: { id: "price_arranque_123" },
              current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
            },
          ],
        },
        metadata: {
          empresaId: "emp_123",
          planId: "ARRANQUE",
        },
      } as any;

      await syncEmpresaFromStripeSubscription(mockSub, undefined, SubscriptionStatus.ACTIVE, mockTx);

      // Verificaciones clave
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: "emp_123" },
        select: { gracePeriodEndsAt: true },
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "emp_123" },
        data: expect.objectContaining({
          plan: SubscriptionPlan.ARRANQUE,
          stripePriceId: "price_arranque_123",
          stripeSubscriptionId: "sub_test_123",
          stripeSubscriptionItemId: "si_item_123",
          stripeCustomerId: "cus_test_123",
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          gracePeriodEndsAt: null,
        }),
      });
    });

    it("debe fijar gracePeriodEndsAt si la suscripción pasa a past_due y no tenía gracia previa", async () => {
      const mockFindUnique = vi.fn().mockResolvedValue({ gracePeriodEndsAt: null });
      const mockUpdate = vi.fn().mockResolvedValue({ id: "emp_123" });

      const mockTx = {
        empresa: {
          findUnique: mockFindUnique,
          update: mockUpdate,
        },
      } as any;

      const mockSub = {
        id: "sub_test_123",
        status: "past_due",
        customer: "cus_test_123",
        items: {
          data: [
            {
              id: "si_item_123",
              price: { id: "price_arranque_123" },
              current_period_end: Math.floor(Date.now() / 1000),
            },
          ],
        },
        metadata: {
          empresaId: "emp_123",
          planId: "ARRANQUE",
        },
      } as any;

      await syncEmpresaFromStripeSubscription(mockSub, undefined, undefined, mockTx);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "emp_123" },
        data: expect.objectContaining({
          subscriptionStatus: SubscriptionStatus.GRACE_PERIOD,
          gracePeriodEndsAt: expect.any(Date),
        }),
      });
    });
  });

  describe("5. validateDowngradeEligibility", () => {
    it("debe rechazar si la cantidad de sucursales activas excede el plan destino", async () => {
      const mockClient = {
        sucursal: { count: vi.fn().mockResolvedValue(2) },
        producto: { count: vi.fn().mockResolvedValue(50) },
        user: { count: vi.fn().mockResolvedValue(1) },
      };

      const result = await validateDowngradeEligibility(
        "emp_123",
        SubscriptionPlan.ARRANQUE,
        mockClient
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("sucursales activas");
    });

    it("debe rechazar si la cantidad de productos excede el tope del Plan Arranque (75)", async () => {
      const mockClient = {
        sucursal: { count: vi.fn().mockResolvedValue(1) },
        producto: { count: vi.fn().mockResolvedValue(80) },
        user: { count: vi.fn().mockResolvedValue(1) },
      };

      const result = await validateDowngradeEligibility(
        "emp_123",
        SubscriptionPlan.ARRANQUE,
        mockClient
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("productos registrados");
    });

    it("debe rechazar si los usuarios exceden el tope de usuarios del plan", async () => {
      const mockClient = {
        sucursal: { count: vi.fn().mockResolvedValue(1) },
        producto: { count: vi.fn().mockResolvedValue(50) },
        user: { count: vi.fn().mockResolvedValue(4) }, // Arranque permite max 2
      };

      const result = await validateDowngradeEligibility(
        "emp_123",
        SubscriptionPlan.ARRANQUE,
        mockClient
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("usuarios activos");
    });

    it("debe permitir si los recursos están dentro de los límites del plan destino", async () => {
      const mockClient = {
        sucursal: { count: vi.fn().mockResolvedValue(1) },
        producto: { count: vi.fn().mockResolvedValue(50) },
        user: { count: vi.fn().mockResolvedValue(2) },
      };

      const result = await validateDowngradeEligibility(
        "emp_123",
        SubscriptionPlan.ARRANQUE,
        mockClient
      );

      expect(result.allowed).toBe(true);
    });
  });
});
