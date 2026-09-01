import { describe, it, expect } from 'vitest';
import { roundCustom } from '../../lib/db';
// ─── Helpers locales (mirror del reducer de useCart.ts) ────────────────────
// Estos helpers replican la lógica pura de totalCart sin depender de React/Dexie.
// Si useCart.ts cambia su lógica, estos tests deben actualizarse también.
interface CartItemStub {
  producto_id: string;
  parent_id: string | null;
  price: number;
  precio_mayoreo: number | null;
  min_cantidad_mayoreo: number | null;
  quantity: number;
  descuento_manual: number;
}
function calcTotalCart(items: CartItemStub[]): number {
  const groupQuantities = new Map<string, number>();
  items.forEach(item => {
    const key = item.parent_id || item.producto_id;
    groupQuantities.set(key, (groupQuantities.get(key) || 0) + item.quantity);
  });
  return items.reduce((acc, item) => {
    const key = item.parent_id || item.producto_id;
    const groupQty = groupQuantities.get(key) || 0;
    const hasMayoreo =
      item.min_cantidad_mayoreo !== null &&
      item.precio_mayoreo !== null &&
      groupQty >= item.min_cantidad_mayoreo;
    const basePrice = hasMayoreo ? (item.precio_mayoreo as number) : item.price;
    const subtotalItem = Math.max(0, roundCustom(basePrice * item.quantity) - item.descuento_manual);
    return acc + subtotalItem;
  }, 0);
}
// ─── Tests de roundCustom ───────────────────────────────────────────────────
describe('roundCustom — lógica de redondeo personalizado', () => {
  it('redondea hacia abajo si el decimal es < 0.6', () => {
    expect(roundCustom(10.5)).toBe(10);
    expect(roundCustom(10.59)).toBe(10);
    expect(roundCustom(99.1)).toBe(99);
  });
  it('redondea hacia arriba si el decimal es >= 0.6', () => {
    expect(roundCustom(10.6)).toBe(11);
    expect(roundCustom(10.9)).toBe(11);
    expect(roundCustom(99.6)).toBe(100);
  });
  it('no modifica enteros exactos', () => {
    expect(roundCustom(100)).toBe(100);
    expect(roundCustom(0)).toBe(0);
  });
  it('maneja el caso límite exacto 0.6', () => {
    expect(roundCustom(1.6)).toBe(2);
  });
});
// ─── Tests de totalCart: casos base ────────────────────────────────────────
describe('calcTotalCart — carrito sin mayoreo', () => {
  it('calcula correctamente un carrito simple sin descuento', () => {
    const items: CartItemStub[] = [
      { producto_id: 'p1', parent_id: null, price: 100, precio_mayoreo: null, min_cantidad_mayoreo: null, quantity: 2, descuento_manual: 0 },
    ];
    // Roto a propósito para probar el CI de GitHub Actions
    expect(calcTotalCart(items)).toBe(9999);
  });
  it('aplica descuento manual correctamente', () => {
    const items: CartItemStub[] = [
      { producto_id: 'p1', parent_id: null, price: 100, precio_mayoreo: null, min_cantidad_mayoreo: null, quantity: 2, descuento_manual: 50 },
    ];
    // subtotal = roundCustom(100*2) - 50 = 200 - 50 = 150
    expect(calcTotalCart(items)).toBe(150);
  });
  it('GUARD: descuento mayor al subtotal del ítem resulta en 0, nunca negativo', () => {
    const items: CartItemStub[] = [
      { producto_id: 'p1', parent_id: null, price: 50, precio_mayoreo: null, min_cantidad_mayoreo: null, quantity: 1, descuento_manual: 80 },
    ];
    // subtotal = 50 - 80 = -30 → Math.max(0, -30) = 0
    expect(calcTotalCart(items)).toBe(0);
  });
  it('total nunca es negativo con múltiples ítems con descuentos excesivos', () => {
    const items: CartItemStub[] = [
      { producto_id: 'p1', parent_id: null, price: 50, precio_mayoreo: null, min_cantidad_mayoreo: null, quantity: 1, descuento_manual: 100 },
      { producto_id: 'p2', parent_id: null, price: 30, precio_mayoreo: null, min_cantidad_mayoreo: null, quantity: 1, descuento_manual: 100 },
    ];
    expect(calcTotalCart(items)).toBeGreaterThanOrEqual(0);
    expect(calcTotalCart(items)).toBe(0);
  });
});
// ─── Tests de mayoreo por familia de variantes ─────────────────────────────
describe('calcTotalCart — mayoreo por familia (cross-variant)', () => {
  const PARENT_ID = 'familia-A';
  it('NO aplica mayoreo si la cantidad familiar está por debajo del umbral', () => {
    const items: CartItemStub[] = [
      { producto_id: 'v1', parent_id: PARENT_ID, price: 100, precio_mayoreo: 80, min_cantidad_mayoreo: 5, quantity: 2, descuento_manual: 0 },
      { producto_id: 'v2', parent_id: PARENT_ID, price: 100, precio_mayoreo: 80, min_cantidad_mayoreo: 5, quantity: 2, descuento_manual: 0 },
    ];
    // familyQty = 4 < 5 → precio normal
    // total = 4 × 100 = 400
    expect(calcTotalCart(items)).toBe(400);
  });
  it('CASO LÍMITE EXACTO: aplica mayoreo cuando familyQuantity === minQuantityForWholesale', () => {
    const items: CartItemStub[] = [
      { producto_id: 'v1', parent_id: PARENT_ID, price: 100, precio_mayoreo: 80, min_cantidad_mayoreo: 5, quantity: 3, descuento_manual: 0 },
      { producto_id: 'v2', parent_id: PARENT_ID, price: 100, precio_mayoreo: 80, min_cantidad_mayoreo: 5, quantity: 2, descuento_manual: 0 },
    ];
    // familyQty = 5 === 5 → operador >= activa mayoreo
    // total = (3×80) + (2×80) = 240 + 160 = 400
    expect(calcTotalCart(items)).toBe(400);
  });
  it('aplica mayoreo cuando familyQuantity supera el umbral', () => {
    const items: CartItemStub[] = [
      { producto_id: 'v1', parent_id: PARENT_ID, price: 100, precio_mayoreo: 80, min_cantidad_mayoreo: 5, quantity: 6, descuento_manual: 0 },
    ];
    // familyQty = 6 > 5 → mayoreo
    // total = 6 × 80 = 480
    expect(calcTotalCart(items)).toBe(480);
  });
  it('al remover un ítem que hacía alcanzar el umbral, el precio vuelve a normal', () => {
    // Simulamos el estado del carrito DESPUÉS de remover un ítem
    // Original: v1(qty:3) + v2(qty:2) = 5 (mayoreo activo)
    // Después de remover 1 unidad de v2: v1(qty:3) + v2(qty:1) = 4 (mayoreo inactivo)
    const itemsAfterRemoval: CartItemStub[] = [
      { producto_id: 'v1', parent_id: PARENT_ID, price: 100, precio_mayoreo: 80, min_cantidad_mayoreo: 5, quantity: 3, descuento_manual: 0 },
      { producto_id: 'v2', parent_id: PARENT_ID, price: 100, precio_mayoreo: 80, min_cantidad_mayoreo: 5, quantity: 1, descuento_manual: 0 },
    ];
    // familyQty = 4 < 5 → precio normal
    // total = (3×100) + (1×100) = 400
    expect(calcTotalCart(itemsAfterRemoval)).toBe(400);
  });
  it('DOS familias distintas en el carrito no se contaminan entre sí', () => {
    const items: CartItemStub[] = [
      // Familia A: qty total = 5 → activa mayoreo
      { producto_id: 'a1', parent_id: 'familia-A', price: 100, precio_mayoreo: 80, min_cantidad_mayoreo: 5, quantity: 5, descuento_manual: 0 },
      // Familia B: qty total = 2 → NO activa mayoreo (umbral = 10)
      { producto_id: 'b1', parent_id: 'familia-B', price: 200, precio_mayoreo: 150, min_cantidad_mayoreo: 10, quantity: 2, descuento_manual: 0 },
    ];
    // Familia A: 5 × 80 = 400 (mayoreo)
    // Familia B: 2 × 200 = 400 (precio normal)
    // Total = 800
    expect(calcTotalCart(items)).toBe(800);
  });
  it('producto simple sin parent_id se agrupa por su propio producto_id', () => {
    const items: CartItemStub[] = [
      { producto_id: 'simple-1', parent_id: null, price: 50, precio_mayoreo: null, min_cantidad_mayoreo: null, quantity: 3, descuento_manual: 0 },
      { producto_id: 'simple-2', parent_id: null, price: 70, precio_mayoreo: null, min_cantidad_mayoreo: null, quantity: 2, descuento_manual: 0 },
    ];
    // (3×50) + (2×70) = 150 + 140 = 290
    expect(calcTotalCart(items)).toBe(290);
  });
});
