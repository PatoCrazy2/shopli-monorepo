import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../lib/db';
import { pullFromCloud } from '../../lib/sync';
import { db as prisma, Role } from '@shopli/db';

describe('pullFromCloud integration', () => {

  beforeAll(async () => {
    // Definimos la variable global para apiClient.ts
    vi.stubGlobal('import.meta', { env: { VITE_API_BASE_URL: 'http://localhost:3000/api' } });

    // 1. Aseguramos que haya al menos 1 producto y 1 usuario en PostgreSQL
    const userCount = await prisma.user.count({ where: { role: Role.CAJERO } });
    if (userCount === 0) {
      await prisma.user.create({
        data: {
          name: 'Test Cajero Integra',
          email: 'integra@cajero.com',
          role: Role.CAJERO,
          pin_hash: 'dummyhash',
        }
      });
    }

    const prodCount = await prisma.producto.count();
    if (prodCount === 0) {
      await prisma.producto.create({
        data: {
          nombre: 'Test Producto Integra',
          codigo_interno: 'INT-01',
          precio_publico: 100,
          costo: 50,
        }
      });
    }
    
    // Asumimos que la Sucursal "branch-1" y una inyección de inventario ya existen o creamos algo dummy
    const branchCount = await prisma.sucursal.count();
    let branch;
    if (branchCount === 0) {
      branch = await prisma.sucursal.create({
        data: { id: "branch-1", nombre: "Sucursal Integra" }
      });
    }

    // Le damos algo de stock para que no falle al serializar "p.inventario" en sync/pull/route.ts
    const testProd = await prisma.producto.findFirst();
    const invCount = testProd ? await prisma.inventario_Sucursal.count({ where: { producto_id: testProd.id } }) : 0;
    
    if (testProd && invCount === 0) {
      const sucursalToUse = branch || await prisma.sucursal.findFirst();
      if(sucursalToUse) {
        await prisma.inventario_Sucursal.create({
          data: {
            producto_id: testProd.id,
            sucursal_id: sucursalToUse.id,
            cantidad: 10
          }
        });
      }
    }
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
  });

  it('debe barrer la base de datos local y poblarla con los datos traidos de PostgreSQL', async () => {
    // 2. Limpiamos la base local de Dexie
    await db.products.clear();
    await db.users.clear();
    await db.meta.clear();
    await db.inventory.clear();

    const initialUsersCount = await db.users.count();
    const initialProductsCount = await db.products.count();

    expect(initialUsersCount).toBe(0);
    expect(initialProductsCount).toBe(0);

    // 3. Ejecutamos el Pull (BFF fetch)
    const result = await pullFromCloud();

    expect(result.source).toBe('cloud');

    // 4. Verificamos Dexie
    const usersCount = await db.users.count();
    const productsCount = await db.products.count();

    expect(usersCount).toBeGreaterThan(0);
    expect(productsCount).toBeGreaterThan(0);

    // Verificamos meta para constatar el updated
    const lastSyncedAt = await db.meta.get('lastSyncedAt');
    expect(lastSyncedAt).toBeDefined();
    expect(lastSyncedAt?.value).toBeTruthy();
  });
});
