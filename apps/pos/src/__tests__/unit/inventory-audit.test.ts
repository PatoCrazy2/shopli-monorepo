import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ============================================================================
// Dominio de Auditoría Dinámica (Conteo Ciego) - Lógica Pura
// Fórmula de Discrepancia:
// Discrepancy = CountedQuantity - (InitialStock - Sum(SoldQty in [T0, Tend]))
// ============================================================================

export interface DynamicAuditItemState {
  productId: string;
  initialStock: number;
  countedQuantity: number | null;
  countedAt: Date | null;
  expectedAtCount?: number;
  difference?: number;
}

export interface SaleDetailRecord {
  productoId: string;
  cantidad: number;
  fecha: Date;
}

/**
 * Validador Zod para countedQuantity que rechaza números negativos
 */
export const countedQuantitySchema = z.number().int().nonnegative().nullable();

/**
 * Calcula la discrepancia de un ítem auditado dado el rango temporal y ventas registradas
 */
export function calculateAuditDiscrepancy(
  initialStock: number,
  countedQuantity: number,
  startedAt: Date,
  countedAt: Date,
  sales: SaleDetailRecord[],
  productId: string
): { expectedAtCount: number; difference: number; soldDuringWindow: number } {
  // Validar conteo físico
  const validatedCount = countedQuantitySchema.parse(countedQuantity);
  if (validatedCount === null) {
    throw new Error('El conteo físico no puede ser nulo para el cálculo de discrepancia');
  }

  // Filtrar y sumar únicamente las ventas dentro de la ventana [T0, Tend] para el producto
  const windowSales = sales.filter(
    (s) =>
      s.productoId === productId &&
      s.fecha.getTime() >= startedAt.getTime() &&
      s.fecha.getTime() <= countedAt.getTime()
  );

  const soldDuringWindow = windowSales.reduce((acc, s) => acc + s.cantidad, 0);
  const expectedAtCount = initialStock - soldDuringWindow;
  const difference = validatedCount - expectedAtCount;

  return {
    expectedAtCount,
    difference,
    soldDuringWindow,
  };
}

// ============================================================================
// Suite Unitaria de Fórmula y Límites (inventory-audit.test.ts)
// ============================================================================

describe('Auditorías Dinámicas (Conteo Ciego) - Fórmula y Límites', () => {
  const PRODUCT_ID = 'prod-123';
  const T0 = new Date('2026-08-31T10:00:00.000Z');
  const T_END = new Date('2026-08-31T12:00:00.000Z');

  // Test 1: Conteo exacto sin ventas (diff = 0)
  it('Test 1: Conteo exacto sin ventas intermedias resulta en discrepancia 0', () => {
    const initialStock = 50;
    const countedQuantity = 50;
    const sales: SaleDetailRecord[] = [];

    const result = calculateAuditDiscrepancy(
      initialStock,
      countedQuantity,
      T0,
      T_END,
      sales,
      PRODUCT_ID
    );

    expect(result.soldDuringWindow).toBe(0);
    expect(result.expectedAtCount).toBe(50);
    expect(result.difference).toBe(0);
  });

  // Test 2: Conteo con ventas legítimas en la ventana restadas del stock esperado
  it('Test 2: Conteo con ventas legítimas dentro de [T0, Tend] se restan correctamente del stock esperado', () => {
    const initialStock = 100;
    const countedQuantity = 85;
    const sales: SaleDetailRecord[] = [
      { productoId: PRODUCT_ID, cantidad: 10, fecha: new Date('2026-08-31T10:30:00.000Z') },
      { productoId: PRODUCT_ID, cantidad: 5, fecha: new Date('2026-08-31T11:15:00.000Z') },
    ];

    const result = calculateAuditDiscrepancy(
      initialStock,
      countedQuantity,
      T0,
      T_END,
      sales,
      PRODUCT_ID
    );

    // Expected = 100 - (10 + 5) = 85. Difference = 85 - 85 = 0
    expect(result.soldDuringWindow).toBe(15);
    expect(result.expectedAtCount).toBe(85);
    expect(result.difference).toBe(0);
  });

  // Test 3: Ventas fuera de la ventana (antes de T0 o después de Tend) no afectan el cálculo
  it('Test 3: Ventas fuera de la ventana (antes de T0 o después de Tend) no afectan el cálculo', () => {
    const initialStock = 100;
    const countedQuantity = 90;
    const sales: SaleDetailRecord[] = [
      // Venta antes de T0
      { productoId: PRODUCT_ID, cantidad: 20, fecha: new Date('2026-08-31T09:30:00.000Z') },
      // Venta legítima dentro de [T0, Tend]
      { productoId: PRODUCT_ID, cantidad: 10, fecha: new Date('2026-08-31T10:45:00.000Z') },
      // Venta después de Tend
      { productoId: PRODUCT_ID, cantidad: 15, fecha: new Date('2026-08-31T13:00:00.000Z') },
      // Venta de otro producto dentro de la ventana
      { productoId: 'other-prod', cantidad: 30, fecha: new Date('2026-08-31T11:00:00.000Z') },
    ];

    const result = calculateAuditDiscrepancy(
      initialStock,
      countedQuantity,
      T0,
      T_END,
      sales,
      PRODUCT_ID
    );

    // Expected = 100 - 10 = 90. Difference = 90 - 90 = 0
    expect(result.soldDuringWindow).toBe(10);
    expect(result.expectedAtCount).toBe(90);
    expect(result.difference).toBe(0);
  });

  // Test 4: Detección correcta de faltantes (pérdidas)
  it('Test 4: Detección correcta de faltantes (pérdidas o mermas)', () => {
    const initialStock = 50;
    const countedQuantity = 40; // Faltan 5 unidades
    const sales: SaleDetailRecord[] = [
      { productoId: PRODUCT_ID, cantidad: 5, fecha: new Date('2026-08-31T10:30:00.000Z') },
    ];

    const result = calculateAuditDiscrepancy(
      initialStock,
      countedQuantity,
      T0,
      T_END,
      sales,
      PRODUCT_ID
    );

    // Expected = 50 - 5 = 45. Difference = 40 - 45 = -5
    expect(result.soldDuringWindow).toBe(5);
    expect(result.expectedAtCount).toBe(45);
    expect(result.difference).toBe(-5);
  });

  // Test 5: Detección correcta de sobrantes
  it('Test 5: Detección correcta de sobrantes en inventario', () => {
    const initialStock = 30;
    const countedQuantity = 32; // Sobran 4 unidades (tras 2 vendidas)
    const sales: SaleDetailRecord[] = [
      { productoId: PRODUCT_ID, cantidad: 2, fecha: new Date('2026-08-31T11:00:00.000Z') },
    ];

    const result = calculateAuditDiscrepancy(
      initialStock,
      countedQuantity,
      T0,
      T_END,
      sales,
      PRODUCT_ID
    );

    // Expected = 30 - 2 = 28. Difference = 32 - 28 = +4
    expect(result.soldDuringWindow).toBe(2);
    expect(result.expectedAtCount).toBe(28);
    expect(result.difference).toBe(4);
  });

  // Test 6: Rechazo/bloqueo de Qcounted < 0
  it('Test 6: Rechazo/bloqueo de countedQuantity < 0 mediante schema Zod', () => {
    // Validación directa del schema Zod
    expect(() => countedQuantitySchema.parse(-1)).toThrow();
    expect(() => countedQuantitySchema.parse(-50)).toThrow();

    // Valores permitidos: 0, enteros positivos, o null
    expect(countedQuantitySchema.parse(0)).toBe(0);
    expect(countedQuantitySchema.parse(10)).toBe(10);
    expect(countedQuantitySchema.parse(null)).toBeNull();

    // Rechazo dentro de la función de cálculo
    expect(() =>
      calculateAuditDiscrepancy(
        50,
        -5,
        T0,
        T_END,
        [],
        PRODUCT_ID
      )
    ).toThrow();
  });
});
