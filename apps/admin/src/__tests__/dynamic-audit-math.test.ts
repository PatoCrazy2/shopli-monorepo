import { describe, it, expect } from "vitest";
import {
  reconstructInitialStock,
  calculateExpectedStock,
  calculateAuditDifference,
  computeDynamicAuditItemMetrics,
} from "../lib/dynamic-audit-math";

describe("dynamic-audit-math (Cálculo Financiero de Auditoría Dinámica)", () => {
  it("1. Sin ventas en la ventana: stock esperado es igual al stock inicial y diferencia 0", () => {
    const initialStock = 40;
    const { expectedAtCount, difference } = computeDynamicAuditItemMetrics({
      initialStock,
      countedQuantity: 40,
      soldInWindow: 0,
    });

    expect(expectedAtCount).toBe(40);
    expect(difference).toBe(0);
  });

  it("2. Ventas dentro de la ventana [startedAt, countedAt] se restan del stock inicial", () => {
    const initialStock = 100;
    const soldInWindow = 18;
    const countedQuantity = 82;

    const { expectedAtCount, difference } = computeDynamicAuditItemMetrics({
      initialStock,
      countedQuantity,
      soldInWindow,
    });

    expect(expectedAtCount).toBe(82);
    expect(difference).toBe(0);
  });

  it("3. Snapshot tardío reconstruido produce exactamente el mismo resultado que un snapshot tomado en startedAt", () => {
    // Escenario: En startedAt (10:00) había 50 unidades.
    // A las 10:15 se venden 6 unidades (ya sincronizadas -> stockActual = 44).
    // A las 10:30 el cajero cuenta físicamente 44 unidades.
    // A las 10:40 se venden otras 4 unidades (ya sincronizadas -> stockActual = 40).
    // A las 11:00 llega por primera vez el sync de la auditoría al servidor.
    const currentServerStockAt11 = 40;
    const totalSoldSinceStartedAt = 6 + 4; // 10 unidades vendidas desde las 10:00
    const soldBetweenStartAndCount = 6; // solo las 6 vendidas entre 10:00 y 10:30

    const reconstructedInitial = reconstructInitialStock(
      currentServerStockAt11,
      totalSoldSinceStartedAt
    );
    expect(reconstructedInitial).toBe(50);

    const { expectedAtCount, difference } = computeDynamicAuditItemMetrics({
      initialStock: reconstructedInitial,
      countedQuantity: 44,
      soldInWindow: soldBetweenStartAndCount,
    });

    expect(expectedAtCount).toBe(44);
    expect(difference).toBe(0);
  });

  it("4. Diferencia negativa (faltante / merma) y positiva (sobrante)", () => {
    // Faltante de 3 unidades
    const faltante = computeDynamicAuditItemMetrics({
      initialStock: 25,
      soldInWindow: 5, // esperado = 20
      countedQuantity: 17,
    });
    expect(faltante.expectedAtCount).toBe(20);
    expect(faltante.difference).toBe(-3);

    // Sobrante de 4 unidades
    const sobrante = computeDynamicAuditItemMetrics({
      initialStock: 25,
      soldInWindow: 5, // esperado = 20
      countedQuantity: 24,
    });
    expect(sobrante.expectedAtCount).toBe(20);
    expect(sobrante.difference).toBe(4);
  });

  it("5. Soporta stock actual o inicial negativo sin distorsión aritmética", () => {
    // Si una sucursal vendió en negativo antes de registrar su compra
    const reconstructed = reconstructInitialStock(-5, 3);
    expect(reconstructed).toBe(-2);

    const expected = calculateExpectedStock(reconstructed, 2);
    expect(expected).toBe(-4);

    // Si en físico cuentan 10 piezas reales en anaquel, el ajuste positivo es +14 (-4 + 14 = 10)
    const diff = calculateAuditDifference(10, expected);
    expect(diff).toBe(14);
  });

  it("6. Rechaza cantidades contadas negativas o no enteras", () => {
    expect(() => calculateAuditDifference(-1, 10)).toThrow();
    expect(() => calculateAuditDifference(2.5, 10)).toThrow();
  });
});
