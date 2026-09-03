import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionPlan, SubscriptionStatus } from "@shopli/db";
import {
  canAddProduct,
  canAddBranch,
  canAddUser,
  canAccessAnalytics,
  canAccessDynamicAudits,
  getEmpresaWithSubscription,
} from "../check-plan-limits";
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
      producto: {
        count: vi.fn(),
      },
      sucursal: {
        count: vi.fn(),
      },
      user: {
        count: vi.fn(),
      },
    },
  };
});

describe("Fase 4 - Candados Server-Side de Recursos y Acceso a Módulos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. canAddProduct (Límite de Catálogo)", () => {
    it("Plan Arranque: debe rechazar si ya cuenta con 75 productos base", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_1",
        nombre: "Tienda Demo",
        plan: SubscriptionPlan.ARRANQUE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_1",
      });
      (db.producto.count as any).mockResolvedValue(75);

      const res = await canAddProduct("emp_1");

      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Has alcanzado el límite de 75 productos");
      expect(res.currentCount).toBe(75);
      expect(res.maxAllowed).toBe(75);
    });

    it("Plan Arranque: debe permitir si cuenta con menos de 75 productos", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_1",
        nombre: "Tienda Demo",
        plan: SubscriptionPlan.ARRANQUE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_1",
      });
      (db.producto.count as any).mockResolvedValue(74);

      const res = await canAddProduct("emp_1");

      expect(res.allowed).toBe(true);
      expect(res.currentCount).toBe(74);
      expect(res.maxAllowed).toBe(75);
    });

    it("Plan Crecimiento: debe permitir productos ilimitados sin importar el conteo", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_2",
        nombre: "Supermercado",
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_2",
      });

      const res = await canAddProduct("emp_2");

      expect(res.allowed).toBe(true);
      expect(res.maxAllowed).toBe(Infinity);
      // No necesita consultar conteo a la base de datos si es infinito
      expect(db.producto.count).not.toHaveBeenCalled();
    });

    it("Suscripción suspendida (PAST_DUE): debe rechazar independientemente del plan", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_3",
        nombre: "Tienda Suspendida",
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_3",
      });

      const res = await canAddProduct("emp_3");

      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Tu suscripción se encuentra suspendida");
    });
  });

  describe("2. canAddBranch (Límite de Sucursales)", () => {
    it("Plan Arranque: debe rechazar si ya cuenta con 1 sucursal activa", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_1",
        plan: SubscriptionPlan.ARRANQUE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_1",
      });
      (db.sucursal.count as any).mockResolvedValue(1);

      const res = await canAddBranch("emp_1");

      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Has alcanzado el límite de 1 sucursal");
    });

    it("Plan Multi-Sucursal: debe permitir crear si tiene 2 sucursales (límite 3)", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_multi",
        plan: SubscriptionPlan.MULTISUCURSAL,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_multi",
      });
      (db.sucursal.count as any).mockResolvedValue(2);

      const res = await canAddBranch("emp_multi");

      expect(res.allowed).toBe(true);
      expect(res.currentCount).toBe(2);
      expect(res.maxAllowed).toBe(3);
    });

    it("Plan Multi-Sucursal: debe rechazar si ya tiene 3 sucursales", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_multi",
        plan: SubscriptionPlan.MULTISUCURSAL,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_multi",
      });
      (db.sucursal.count as any).mockResolvedValue(3);

      const res = await canAddBranch("emp_multi");

      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Has alcanzado el límite de 3 sucursal(es)");
    });
  });

  describe("3. canAddUser (Límite de Usuarios/Cajeros)", () => {
    it("Plan Arranque: debe rechazar si ya tiene 2 usuarios activos", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_1",
        plan: SubscriptionPlan.ARRANQUE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_1",
      });
      (db.user.count as any).mockResolvedValue(2);

      const res = await canAddUser("emp_1");

      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Has alcanzado el límite de 2 usuarios");
    });

    it("Plan Crecimiento: debe permitir hasta 3 usuarios activos", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_2",
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_2",
      });
      (db.user.count as any).mockResolvedValue(2);

      const res = await canAddUser("emp_2");

      expect(res.allowed).toBe(true);
      expect(res.maxAllowed).toBe(3);
    });

    it("Plan Multi-Sucursal: usuarios ilimitados", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_3",
        plan: SubscriptionPlan.MULTISUCURSAL,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_3",
      });

      const res = await canAddUser("emp_3");

      expect(res.allowed).toBe(true);
      expect(res.maxAllowed).toBe(Infinity);
      expect(db.user.count).not.toHaveBeenCalled();
    });
  });

  describe("4. Acceso a Módulos Exclusivos (canAccessAnalytics y canAccessDynamicAudits)", () => {
    it("Plan Arranque: no tiene acceso a Analítica ni a Auditorías Dinámicas", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_arranque",
        plan: SubscriptionPlan.ARRANQUE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_arranque",
      });

      const hasAnalytics = await canAccessAnalytics("emp_arranque");
      const hasAudits = await canAccessDynamicAudits("emp_arranque");

      expect(hasAnalytics).toBe(false);
      expect(hasAudits).toBe(false);
    });

    it("Plan Crecimiento: tiene acceso completo a Analítica y Auditorías Dinámicas", async () => {
      (db.empresa.findUnique as any).mockResolvedValue({
        id: "emp_crec",
        plan: SubscriptionPlan.CRECIMIENTO,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        stripeSubscriptionId: "sub_crec",
      });

      const hasAnalytics = await canAccessAnalytics("emp_crec");
      const hasAudits = await canAccessDynamicAudits("emp_crec");

      expect(hasAnalytics).toBe(true);
      expect(hasAudits).toBe(true);
    });
  });
});
