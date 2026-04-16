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
    vi.stubGlobal('import.meta', { env: { VITE_API_BASE_URL: 'http://localhost:3000/api' } });
    vi.stubGlobal('navigator', { onLine: true });

    // 1. Setup Postgres data needed for a successful Push
    // Sucursal
    const branch = await prisma.sucursal.findFirst();
    if (!branch) {
      const newBranch = await prisma.sucursal.create({
        data: { id: "branch-push-test", nombre: "Push Test Branch" }
      });
      testBranchId = newBranch.id;
    } else {
      testBranchId = branch.id;
    }

    // Usuario Cajero
    let cashier = await prisma.user.findFirst({ where: { role: Role.CAJERO } });
    if (!cashier) {
      cashier = await prisma.user.create({
        data: {
          name: 'Pusher Cashier',
          email: 'pusher@cajero.com',
          role: Role.CAJERO,
          pin_hash: 'dummy',
        }
      });
    }
    cashierId = cashier.id;

    // Producto
    let product = await prisma.producto.findFirst();
    if (!product) {
      product = await prisma.producto.create({
        data: {
          nombre: 'Push Product',
          precio_publico: 100,
          costo: 50,
        }
      });
    }
    productId = product.id;

    // Inventario para ese producto en esa sucursal
    const invCount = await prisma.inventario_Sucursal.count({ 
      where: { sucursal_id: testBranchId, producto_id: productId } 
    });
    if (invCount === 0) {
      await prisma.inventario_Sucursal.create({
        data: {
          sucursal_id: testBranchId,
          producto_id: productId,
          cantidad: 100,
        }
      });
    } else {
      await prisma.inventario_Sucursal.update({
        where: { sucursal_id_producto_id: { sucursal_id: testBranchId, producto_id: productId } },
        data: { cantidad: 100 }
      });
    }

    // Turno Abierto
    let turno = await prisma.turno.findFirst({
      where: { usuario_id: cashierId, sucursal_id: testBranchId, estado: EstadoTurno.ABIERTO }
    });
    if (!turno) {
      turno = await prisma.turno.create({
        data: {
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

    // 5. Aserción final en Dexie verificando que fue actualizado a SYNCED
    const finalSale = await db.sales.get(localSaleId);
    expect(finalSale).not.toBeUndefined();
    expect(finalSale?.sync_status).toBe('SYNCED');
    const finalDetailsCount = await db.sale_details.count();
    expect(finalDetailsCount).toBe(0);
  });
});
