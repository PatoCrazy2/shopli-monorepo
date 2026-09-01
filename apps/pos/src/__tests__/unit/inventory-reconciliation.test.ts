import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// Tipos del Dominio de Reconciliación Asíncrona
// ============================================================================

export type AuditStatus = 'OPEN' | 'CLOSED';

export interface DynamicAuditRecord {
  id: string;
  sucursalId: string;
  status: AuditStatus;
  startedAt: Date;
  isApplied: boolean;
}

export interface DynamicAuditItemRecord {
  id: string;
  auditId: string;
  productId: string;
  initialStock: number;
  countedQuantity: number | null;
  countedAt: Date | null;
  expectedAtCount: number | null;
  difference: number | null;
}

export interface SaleDetailPayload {
  producto_id: string;
  cantidad: number;
}

export interface SalePayload {
  id: string;
  turno_id: string;
  sucursal_id: string;
  estado: 'COMPLETADA' | 'CANCELADA';
  fecha: string;
  detalles: SaleDetailPayload[];
}

export interface MovimientoInventarioRecord {
  id: string;
  producto_id: string;
  sucursal_id: string;
  cantidad: number;
  tipo: 'AJUSTE' | 'INGRESO' | 'EGRESO';
  motivo: string;
  usuario_id: string;
  referencia_id: string;
  fecha: Date;
}

// ============================================================================
// Simulación de Base de Datos en Memoria para Pruebas de Flujo
// Replicando la lógica exacta de apps/admin/src/app/api/pos/sync/push/route.ts
// ============================================================================

export class MockSyncTransactionContext {
  audits: DynamicAuditRecord[] = [];
  auditItems: DynamicAuditItemRecord[] = [];
  sales: SalePayload[] = [];
  movimientos: MovimientoInventarioRecord[] = [];
  turnos: { id: string; usuario_id: string }[] = [];

  /**
   * Procesa una venta entrante replicando la lógica transaccional de push/route.ts
   */
  async processSalePush(venta: SalePayload): Promise<{ isDuplicate: boolean }> {
    // 1. Verificar idempotencia de la venta
    const existingSale = this.sales.find((s) => s.id === venta.id);
    if (existingSale) {
      // Venta ya existente: es un reintento idempotente, no se vuelve a insertar ni recalcular
      return { isDuplicate: true };
    }

    // Registrar venta
    this.sales.push(venta);

    if (venta.estado !== 'COMPLETADA') {
      return { isDuplicate: false };
    }

    const saleDate = new Date(venta.fecha);
    const seventyTwoHoursAgo = new Date(saleDate.getTime() - 72 * 60 * 60 * 1000);
    const saleProductIds = venta.detalles.map((d) => d.producto_id);

    // 2. Buscar items de auditorías dentro de la ventana de corte (<72h) que intersecten
    const targetAuditItems = this.auditItems.filter((item) => {
      const audit = this.audits.find((a) => a.id === item.auditId);
      if (!audit) return false;

      return (
        saleProductIds.includes(item.productId) &&
        item.countedQuantity !== null &&
        item.countedAt !== null &&
        item.countedAt.getTime() >= saleDate.getTime() &&
        audit.sucursalId === venta.sucursal_id &&
        !audit.isApplied &&
        audit.startedAt.getTime() >= seventyTwoHoursAgo.getTime() &&
        audit.startedAt.getTime() <= saleDate.getTime()
      );
    });

    const turnoVenta = this.turnos.find((t) => t.id === venta.turno_id);
    const fallbackUserId = turnoVenta?.usuario_id || 'fallback-user';

    // 3. Recalcular ventas vía agregación directa (fresh aggregation)
    for (const item of targetAuditItems) {
      const audit = this.audits.find((a) => a.id === item.auditId)!;

      // Consulta agregada directa de detalle_Venta en [startedAt, countedAt]
      let freshSoldQty = 0;
      for (const s of this.sales) {
        if (s.sucursal_id === audit.sucursalId && s.estado === 'COMPLETADA') {
          const sDate = new Date(s.fecha);
          if (
            sDate.getTime() >= audit.startedAt.getTime() &&
            sDate.getTime() <= item.countedAt!.getTime()
          ) {
            for (const d of s.detalles) {
              if (d.producto_id === item.productId) {
                freshSoldQty += d.cantidad;
              }
            }
          }
        }
      }

      const newExpectedAtCount = item.initialStock - freshSoldQty;
      const newDifference = item.countedQuantity! - newExpectedAtCount;
      const oldDifference = item.difference;

      // Actualizar item
      item.expectedAtCount = newExpectedAtCount;
      item.difference = newDifference;

      // 4. Trazabilidad estricta: Si la auditoría está CLOSED y la discrepancia cambia, registrar en MovimientoInventario
      if (audit.status === 'CLOSED' && oldDifference !== null && oldDifference !== newDifference) {
        this.movimientos.push({
          id: `mov-${this.movimientos.length + 1}`,
          producto_id: item.productId,
          sucursal_id: audit.sucursalId,
          cantidad: newDifference - oldDifference,
          tipo: 'AJUSTE',
          motivo: `Reconciliación retroactiva por venta tardía ${venta.id}. Discrepancia previa: ${oldDifference}, nueva discrepancia: ${newDifference}`,
          usuario_id: fallbackUserId,
          referencia_id: audit.id,
          fecha: new Date(),
        });
      }
    }

    return { isDuplicate: false };
  }
}

// ============================================================================
// Suite de Reconciliación Asíncrona y Ventas Tardías
// ============================================================================

describe('Auditorías Dinámicas - Reconciliación Asíncrona y Ventas Tardías', () => {
  let ctx: MockSyncTransactionContext;
  const SUCURSAL_ID = 'suc-1';
  const PROD_ID = 'prod-abc';
  const USER_ID = 'user-cajero';
  const TURNO_ID = 'turno-1';

  beforeEach(() => {
    ctx = new MockSyncTransactionContext();
    ctx.turnos.push({ id: TURNO_ID, usuario_id: USER_ID });
  });

  // Test 1: Venta tardía recibida con auditoría en estado OPEN recalcula el stock esperado
  it('Test 1: Venta tardía recibida con auditoría en estado OPEN recalcula el stock esperado', async () => {
    const startedAt = new Date('2026-08-31T08:00:00.000Z');
    const countedAt = new Date('2026-08-31T12:00:00.000Z');

    // Auditoría OPEN con conteo registrado
    const auditId = 'audit-open-1';
    ctx.audits.push({
      id: auditId,
      sucursalId: SUCURSAL_ID,
      status: 'OPEN',
      startedAt,
      isApplied: false,
    });

    const item: DynamicAuditItemRecord = {
      id: 'item-1',
      auditId,
      productId: PROD_ID,
      initialStock: 50,
      countedQuantity: 45,
      countedAt,
      expectedAtCount: 50, // Sin ventas previas
      difference: -5,
    };
    ctx.auditItems.push(item);

    // Llega una venta tardía que ocurrió a las 09:30 (dentro de la ventana [08:00, 12:00])
    const lateSale: SalePayload = {
      id: 'sale-late-1',
      turno_id: TURNO_ID,
      sucursal_id: SUCURSAL_ID,
      estado: 'COMPLETADA',
      fecha: '2026-08-31T09:30:00.000Z',
      detalles: [{ producto_id: PROD_ID, cantidad: 5 }],
    };

    await ctx.processSalePush(lateSale);

    // Expected recalculado: 50 - 5 = 45. Discrepancia: 45 - 45 = 0
    expect(item.expectedAtCount).toBe(45);
    expect(item.difference).toBe(0);

    // En estado OPEN no genera MovimientoInventario (la auditoría aún está abierta/en progreso)
    expect(ctx.movimientos.length).toBe(0);
  });

  // Test 2: Venta tardía recibida con auditoría en estado CLOSED (<72h) ajusta la discrepancia y genera el registro de trazabilidad en MovimientoInventario sin sobrescritura silenciosa
  it('Test 2: Venta tardía recibida con auditoría en estado CLOSED (<72h) ajusta la discrepancia y genera log en MovimientoInventario', async () => {
    const startedAt = new Date('2026-08-31T08:00:00.000Z');
    const countedAt = new Date('2026-08-31T12:00:00.000Z');

    // Auditoría CLOSED (<72h) cerrada previamente creyendo que había faltante de -5
    const auditId = 'audit-closed-1';
    ctx.audits.push({
      id: auditId,
      sucursalId: SUCURSAL_ID,
      status: 'CLOSED',
      startedAt,
      isApplied: false,
    });

    const item: DynamicAuditItemRecord = {
      id: 'item-2',
      auditId,
      productId: PROD_ID,
      initialStock: 50,
      countedQuantity: 45,
      countedAt,
      expectedAtCount: 50,
      difference: -5, // Discrepancia previa
    };
    ctx.auditItems.push(item);

    // Venta tardía offline que sincroniza después del cierre de la auditoría
    const lateSale: SalePayload = {
      id: 'sale-late-2',
      turno_id: TURNO_ID,
      sucursal_id: SUCURSAL_ID,
      estado: 'COMPLETADA',
      fecha: '2026-08-31T10:00:00.000Z',
      detalles: [{ producto_id: PROD_ID, cantidad: 5 }],
    };

    await ctx.processSalePush(lateSale);

    // Expected recalculado: 50 - 5 = 45. Discrepancia nueva: 45 - 45 = 0
    expect(item.expectedAtCount).toBe(45);
    expect(item.difference).toBe(0);

    // TRAZABILIDAD OBLIGATORIA: MovimientoInventario registrado sin sobrescritura silenciosa
    expect(ctx.movimientos.length).toBe(1);
    const mov = ctx.movimientos[0];
    expect(mov).toBeDefined();
    expect(mov?.tipo).toBe('AJUSTE');
    expect(mov?.producto_id).toBe(PROD_ID);
    expect(mov?.sucursal_id).toBe(SUCURSAL_ID);
    expect(mov?.referencia_id).toBe(auditId);
    expect(mov?.cantidad).toBe(5); // Cambio: 0 - (-5) = +5
    expect(mov?.motivo).toContain('Reconciliación retroactiva por venta tardía sale-late-2');
    expect(mov?.motivo).toContain('Discrepancia previa: -5, nueva discrepancia: 0');
  });

  // Test 3: Idempotencia: el reenvío duplicado del mismo payload de venta no duplica la resta ni altera la discrepancia
  it('Test 3: Idempotencia: el reenvío duplicado del mismo payload de venta no duplica la resta ni altera la discrepancia', async () => {
    const startedAt = new Date('2026-08-31T08:00:00.000Z');
    const countedAt = new Date('2026-08-31T12:00:00.000Z');

    const auditId = 'audit-closed-idempotent';
    ctx.audits.push({
      id: auditId,
      sucursalId: SUCURSAL_ID,
      status: 'CLOSED',
      startedAt,
      isApplied: false,
    });

    const item: DynamicAuditItemRecord = {
      id: 'item-3',
      auditId,
      productId: PROD_ID,
      initialStock: 50,
      countedQuantity: 45,
      countedAt,
      expectedAtCount: 50,
      difference: -5,
    };
    ctx.auditItems.push(item);

    const salePayload: SalePayload = {
      id: 'sale-idempotent-1',
      turno_id: TURNO_ID,
      sucursal_id: SUCURSAL_ID,
      estado: 'COMPLETADA',
      fecha: '2026-08-31T10:00:00.000Z',
      detalles: [{ producto_id: PROD_ID, cantidad: 5 }],
    };

    // Primer push de la venta
    const res1 = await ctx.processSalePush(salePayload);
    expect(res1.isDuplicate).toBe(false);
    expect(item.expectedAtCount).toBe(45);
    expect(item.difference).toBe(0);
    expect(ctx.movimientos.length).toBe(1);

    // Segundo push (reenvío del mismo payload por reintento de red offline)
    const res2 = await ctx.processSalePush(salePayload);
    expect(res2.isDuplicate).toBe(true);

    // Los valores deben permanecer idénticos (no se vuelve a restar 5 ni a generar otro ajuste)
    expect(item.expectedAtCount).toBe(45);
    expect(item.difference).toBe(0);
    expect(ctx.movimientos.length).toBe(1);
    expect(ctx.sales.length).toBe(1);
  });
});
