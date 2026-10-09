/**
 * Funciones matemáticas puras para el cálculo de stock inicial reconstruido,
 * stock esperado y discrepancia en Auditorías Dinámicas (Conteo Ciego).
 */

/**
 * Reconstruye el stock inicial exacto al momento de inicio de la auditoría (`startedAt`).
 * Si el primer sync de la auditoría llega tarde y ya se sincronizaron ventas COMPLETADAS
 * ocurridas desde `startedAt`, esas ventas ya restaron de `Inventario_Sucursal.cantidad`.
 * Sumarlas de vuelta restituye la fotografía exacta en `T0`.
 */
export function reconstructInitialStock(currentStock: number, soldSinceStart: number): number {
  const safeSold = Math.max(0, Math.trunc(soldSinceStart));
  return Math.trunc(currentStock) + safeSold;
}

/**
 * Calcula el stock esperado al momento exacto del conteo físico (`countedAt`).
 * Fórmula: Expected = InitialStock(T0) - VentasCompletadas[startedAt, countedAt]
 */
export function calculateExpectedStock(initialStock: number, soldInWindow: number): number {
  const safeSold = Math.max(0, Math.trunc(soldInWindow));
  return Math.trunc(initialStock) - safeSold;
}

/**
 * Calcula la discrepancia del conteo físico contra el stock esperado.
 * - Valor 0: Sin discrepancia (exacto)
 * - Valor < 0: Faltante / merma
 * - Valor > 0: Sobrante
 */
export function calculateAuditDifference(countedQuantity: number, expectedStock: number): number {
  if (!Number.isInteger(countedQuantity) || countedQuantity < 0) {
    throw new Error(`countedQuantity inválido (${countedQuantity}): debe ser un entero no negativo.`);
  }
  return countedQuantity - Math.trunc(expectedStock);
}

/**
 * Calcula de forma atómica el stock esperado y la diferencia de un ítem contado.
 */
export function computeDynamicAuditItemMetrics(params: {
  initialStock: number;
  countedQuantity: number;
  soldInWindow: number;
}): { expectedAtCount: number; difference: number } {
  const expectedAtCount = calculateExpectedStock(params.initialStock, params.soldInWindow);
  const difference = calculateAuditDifference(params.countedQuantity, expectedAtCount);
  return { expectedAtCount, difference };
}
