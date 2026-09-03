import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../lib/db';
import { pushToCloud } from '../../lib/sync';
import { db as prisma, Role, EstadoTurno } from '@shopli/db';

describe('pushToCloud integration', () => {
  let cashierId: string;
  let testBranchId: string;
  let productId: string;
  let turnoId: string;

  beforeAll(async () => {
    vi.stubGlobal('import.meta', {
      env: {
        VITE_API_BASE_URL: 'http://localhost:3000/api',
        VITE_SYNC_SECRET: 'ci-pos-sync-secret',
        VITE_POS_SYNC_SECRET: 'ci-pos-sync-secret',
      }
    });
    vi.stubGlobal('navigator', { onLine: true });

    // Ensure test Empresa exists safely without concurrency race conditions
    let testEmpresa = await prisma.empresa.findUnique({ where: { id: 'test-empresa-id' } });
    if (!testEmpresa) {
      try {
        testEmpresa = await prisma.empresa.create({
          data: {
            id: 'test-empresa-id',
            nombre: 'Test Empresa',
          }
        });
      } catch (_) {
        testEmpresa = await prisma.empresa.findUnique({ where: { id: 'test-empresa-id' } });
      }
    }

    if (!testEmpresa) {
      throw new Error('No se pudo inicializar la empresa de prueba');
    }

    // Configurar Dexie con la empresa para permitir sync
    await db.meta.put({ key: 'empresaId', value: testEmpresa.id });

    // 1. Setup Postgres data needed for a successful Push
    // Sucursal vinculada a testEmpresa con UUID válido
    let branch = await prisma.sucursal.findFirst({ where: { empresa_id: testEmpresa.id } });
    if (!branch) {
      branch = await prisma.sucursal.create({
        data: { id: crypto.randomUUID(), nombre: "Push Test Branch", empresa_id: testEmpresa.id }
      });
    }
    testBranchId = branch.id;

    // Usuario Cajero vinculado a testEmpresa con UUID válido
    let cashier = await prisma.user.findFirst({ where: { role: Role.CAJERO, empresa_id: testEmpresa.id } });
    if (!cashier) {
      cashier = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Pusher Cashier',
          email: `pusher-${Date.now()}@cajero.com`,
          role: Role.CAJERO,
          pin_hash: 'dummy',
          empresa_id: testEmpresa.id,
        }
      });
    }
    cashierId = cashier.id;

    // Producto vinculado a testEmpresa con UUID válido
    let product = await prisma.producto.findFirst({ where: { empresa_id: testEmpresa.id } });
    if (!product) {
      product = await prisma.producto.create({
        data: {
          id: crypto.randomUUID(),
          nombre: 'Push Product',
          precio_publico: 100,
          costo: 50,
          empresa_id: testEmpresa.id,
        }
      });
    }
    productId = product.id;

    // Inventario para ese producto en esa sucursal (Upsert atómico para evitar race conditions)
    await prisma.inventario_Sucursal.upsert({
      where: { sucursal_id_producto_id: { sucursal_id: testBranchId, producto_id: productId } },
      update: { cantidad: 100 },
      create: {
        sucursal_id: testBranchId,
        producto_id: productId,
        cantidad: 100,
      }
    });

    // Turno Abierto
    let turno = await prisma.turno.findFirst({
      where: { usuario_id: cashierId, sucursal_id: testBranchId, estado: EstadoTurno.ABIERTO }
    });
    if (!turno) {
      turno = await prisma.turno.create({
        data: {
          id: crypto.randomUUID(),
          usuario_id: cashierId,
          sucursal_id: testBranchId,
          monto_inicial: 500,
          estado: EstadoTurno.ABIERTO,
        }
      });
    }
    turnoId = turno.id;
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
  });

  it('debe tomar las ventas locales, enviarlas al BFF y limpiar Dexie', async () => {
    // 1. Insertar directamente en Dexie una venta mockeada
    await db.sales.clear();
    await db.sale_details.clear();

    const localSaleId = crypto.randomUUID();
    
    await db.sales.add({
      id: localSaleId,
      turno_id: turnoId,
      sucursal_id: testBranchId,
      total: 200,
      estado: 'COMPLETADA',
      sync_status: 'PENDING',
      fecha: new Date().toISOString(),
    });

    await db.sale_details.add({
      id: crypto.randomUUID(),
      venta_id: localSaleId,
      producto_id: productId,
      nombre_producto: 'Push Product',
      cantidad: 2,
      precio_unitario_historico: 100,
    });

    const initialSalesCount = await db.sales.count();
    expect(initialSalesCount).toBe(1);

    // 2. Ejecutar la función pushToCloud()
    const result = await pushToCloud();

    // 3. Aserción de la respuesta (PushResult)
    expect(result.success).toBe(true);
    expect(result.pushed?.ventas).toBe(1);

    // 4. Aserción en Prisma (PostgreSQL) verificando que existe
    const serverSale = await prisma.venta.findUnique({
      where: { id: localSaleId },
      include: { detalles: true }
    });
    
    expect(serverSale).not.toBeNull();
    expect(serverSale?.id).toBe(localSaleId);
    expect(serverSale?.total.toNumber()).toBe(200);
    expect(serverSale?.detalles.length).toBe(1);
    expect(serverSale?.detalles[0].producto_id).toBe(productId);
    expect(serverSale?.detalles[0].cantidad).toBe(2);

    // 5. Aserción final en Dexie verificando que fue actualizado a SYNCED y que se conservan los detalles locales
    const finalSale = await db.sales.get(localSaleId);
    expect(finalSale).not.toBeUndefined();
    expect(finalSale?.sync_status).toBe('SYNCED');
    const finalDetailsCount = await db.sale_details.count();
    expect(finalDetailsCount).toBe(1);
  });

  it('debe rechazar una venta con total manipulado (zero-trust) con status 422', async () => {
    // Este test verifica que el servidor RECALCULA los precios y no confía en el cliente.
    // Enviamos directamente al endpoint con un total fraudulento.
    const fraudSaleId = crypto.randomUUID();
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    const payload = {
      turnos: [],
      ventas: [
        {
          id: fraudSaleId,
          turno_id: turnoId,
          sucursal_id: testBranchId,
          total: 1, // ← MANIPULADO: debería ser 200 (2 × $100)
          estado: 'COMPLETADA',
          fecha: new Date().toISOString(),
          detalles: [
            {
              producto_id: productId,
              cantidad: 2,
              precio_unitario_historico: 100,
              descuento_manual: 0,
            }
          ]
        }
      ],
      auditorias: [],
      gastos: [],
      auditoriasDinamicas: [],
    };

    const response = await fetch(
      `${apiBase}/pos/sync/push?empresaId=test-empresa-id&secret=ci-pos-sync-secret`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pos-sync-secret': 'ci-pos-sync-secret',
          'x-test-bypass': 'true', // Válido en NODE_ENV=test
        },
        body: JSON.stringify(payload),
      }
    );

    // El servidor debe rechazar la venta manipulada
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(body.details).toContain(fraudSaleId);

    // La venta NO debe existir en PostgreSQL
    const serverSale = await prisma.venta.findUnique({ where: { id: fraudSaleId } });
    expect(serverSale).toBeNull();
  });
});
