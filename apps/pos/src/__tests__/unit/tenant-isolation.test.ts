import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, purgeAllTenantData } from '../../lib/db';

describe('Multi-Tenant Client Data Isolation (Purge & Unlink)', () => {
  beforeEach(async () => {
    await purgeAllTenantData();
  });

  it('debe limpiar absolutamente todas las tablas locales al invocar purgeAllTenantData', async () => {
    // 1. Simular que la Empresa A pobló la base de datos local
    await db.meta.put({ key: 'empresaId', value: 'empresa-a-id' });
    await db.meta.put({ key: 'lastSyncedAt', value: new Date().toISOString() });
    await db.meta.put({ key: 'subscriptionSuspended', value: true });

    await db.users.bulkAdd([
      { id: 'user-a1', name: 'Cajero Empresa A', email: 'a1@empresa.com', role: 'CAJERO', pin: '1234' },
      { id: 'user-a2', name: 'Encargado Empresa A', email: 'a2@empresa.com', role: 'ENCARGADO', pin: '5678' }
    ]);

    await db.branches.bulkAdd([
      { id: 'branch-a1', nombre: 'Sucursal Matriz A', direccion: 'Calle A', updatedAt: new Date().toISOString() }
    ]);

    await db.products.bulkAdd([
      {
        id: 'prod-a1',
        nombre: 'Producto Empresa A',
        codigo_interno: 'SKU-A',
        descripcion: null,
        costo: 10,
        precio_publico: 20,
        precio_mayoreo: null,
        min_cantidad_mayoreo: null,
        categoria: 'Cat A',
        isCritical: false,
        isActive: true,
        parent_id: null,
        variante_nombre: null,
        updatedAt: new Date().toISOString()
      }
    ]);

    // Verificar que los datos existen en la BD local
    expect(await db.users.count()).toBe(2);
    expect(await db.branches.count()).toBe(1);
    expect(await db.products.count()).toBe(1);
    expect(await db.meta.count()).toBe(3);

    // 2. Ejecutar la purga completa (como al desvincular o cambiar de tenant)
    await purgeAllTenantData();

    // 3. Verificar que TODAS las tablas queden en 0
    expect(await db.users.count()).toBe(0);
    expect(await db.branches.count()).toBe(0);
    expect(await db.products.count()).toBe(0);
    expect(await db.inventory.count()).toBe(0);
    expect(await db.cart.count()).toBe(0);
    expect(await db.sales.count()).toBe(0);
    expect(await db.sale_details.count()).toBe(0);
    expect(await db.turnos.count()).toBe(0);
    expect(await db.audits.count()).toBe(0);
    expect(await db.gastos.count()).toBe(0);
    expect(await db.dynamicAudits.count()).toBe(0);
    expect(await db.dynamicAuditItems.count()).toBe(0);
    expect(await db.meta.count()).toBe(0);
  });

  it('no debe mezclar datos al desvincular Empresa A y poblar Empresa B', async () => {
    // 1. Poblado de Empresa A
    await db.meta.put({ key: 'empresaId', value: 'empresa-a-id' });
    await db.users.add({ id: 'user-a', name: 'Cajero A', email: 'a@test.com', role: 'CAJERO', pin: '1111' });
    await db.branches.add({ id: 'branch-a', nombre: 'Sucursal A', direccion: null, updatedAt: new Date().toISOString() });

    // 2. Desvinculación
    await purgeAllTenantData();

    // 3. Poblado de Empresa B
    await db.meta.put({ key: 'empresaId', value: 'empresa-b-id' });
    await db.users.add({ id: 'user-b', name: 'Cajero B', email: 'b@test.com', role: 'CAJERO', pin: '2222' });
    await db.branches.add({ id: 'branch-b', nombre: 'Sucursal B', direccion: null, updatedAt: new Date().toISOString() });

    // 4. Verificaciones estrictas
    const remainingUsers = await db.users.toArray();
    const remainingBranches = await db.branches.toArray();

    expect(remainingUsers).toHaveLength(1);
    expect(remainingUsers[0].name).toBe('Cajero B');
    expect(remainingUsers.find(u => u.name === 'Cajero A')).toBeUndefined();

    expect(remainingBranches).toHaveLength(1);
    expect(remainingBranches[0].nombre).toBe('Sucursal B');
    expect(remainingBranches.find(b => b.nombre === 'Sucursal A')).toBeUndefined();
  });
});
