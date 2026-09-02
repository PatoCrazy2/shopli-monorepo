import { describe, it, expect } from "vitest";
import { PLAN_CONFIG } from "../subscription-plans";
import { SubscriptionPlan, SubscriptionStatus } from "@shopli/db";

describe("Fase 3 - Pruebas de la Pantalla de Facturación y Planes", () => {
  describe("1. Validación Matemática de Planes (2 Meses Gratis en Anual)", () => {
    it("Plan Arranque: el costo anual debe equivaler exactamente a 10 meses (2 meses gratis)", () => {
      const plan = PLAN_CONFIG[SubscriptionPlan.ARRANQUE];
      const costo12Meses = plan.prices.monthly.amount * 12;
      const ahorro = costo12Meses - plan.prices.yearly.amount;
      const mesesAhorro = ahorro / plan.prices.monthly.amount;

      expect(plan.prices.monthly.amount).toBe(149);
      expect(plan.prices.yearly.amount).toBe(1490);
      expect(mesesAhorro).toBe(2);
    });

    it("Plan Crecimiento: el costo anual debe equivaler exactamente a 10 meses (2 meses gratis)", () => {
      const plan = PLAN_CONFIG[SubscriptionPlan.CRECIMIENTO];
      const costo12Meses = plan.prices.monthly.amount * 12;
      const ahorro = costo12Meses - plan.prices.yearly.amount;
      const mesesAhorro = ahorro / plan.prices.monthly.amount;

      expect(plan.prices.monthly.amount).toBe(299);
      expect(plan.prices.yearly.amount).toBe(2990);
      expect(mesesAhorro).toBe(2);
    });

    it("Plan Multi-Sucursal: el costo anual debe equivaler exactamente a 10 meses (2 meses gratis)", () => {
      const plan = PLAN_CONFIG[SubscriptionPlan.MULTISUCURSAL];
      const costo12Meses = plan.prices.monthly.amount * 12;
      const ahorro = costo12Meses - plan.prices.yearly.amount;
      const mesesAhorro = ahorro / plan.prices.monthly.amount;

      expect(plan.prices.monthly.amount).toBe(599);
      expect(plan.prices.yearly.amount).toBe(5990);
      expect(mesesAhorro).toBe(2);
    });
  });

  describe("2. Límites y Características de Planes en UI", () => {
    it("Plan Arranque debe tener un límite duro de 75 productos y 1 sucursal", () => {
      const plan = PLAN_CONFIG[SubscriptionPlan.ARRANQUE];
      expect(plan.maxProducts).toBe(75);
      expect(plan.maxBranches).toBe(1);
      expect(plan.maxUsers).toBe(2);
      expect(plan.hasAnalytics).toBe(false);
      expect(plan.hasDynamicAudits).toBe(false);
    });

    it("Plan Crecimiento debe tener productos ilimitados y auditorías habilitadas", () => {
      const plan = PLAN_CONFIG[SubscriptionPlan.CRECIMIENTO];
      expect(plan.maxProducts).toBe(Infinity);
      expect(plan.maxBranches).toBe(1);
      expect(plan.maxUsers).toBe(3);
      expect(plan.hasAnalytics).toBe(true);
      expect(plan.hasDynamicAudits).toBe(true);
    });

    it("Plan Multi-Sucursal debe soportar hasta 3 sucursales y transferencias", () => {
      const plan = PLAN_CONFIG[SubscriptionPlan.MULTISUCURSAL];
      expect(plan.maxBranches).toBe(3);
      expect(plan.maxUsers).toBe(Infinity);
      expect(plan.hasTransfers).toBe(true);
    });
  });
});
