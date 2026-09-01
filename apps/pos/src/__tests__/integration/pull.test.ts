import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../lib/db';
import { pullFromCloud } from '../../lib/sync';
import { db as prisma, Role } from '@shopli/db';

describe('pullFromCloud integration', () => {

  beforeAll(async () => {
    // Definimos la variable global para apiClient.ts
    vi.stubGlobal('import.meta', {
      env: {
        VITE_API_BASE_URL: 'http://localhost:3000/api',
        VITE_SYNC_SECRET: 'ci-pos-sync-secret',
        VITE_POS_SYNC_SECRET: 'ci-pos-sync-secret',
      }
    });

    // Ensure test Empresa exists
    const testEmpresa = await prisma.empresa.upsert({
      where: { id: 'test-empresa-id' },
      update: {},
      create: {
        id: 'test-empresa-id',
        nombre: 'Test Empresa'
      }
    });

    // Configurar Dexie con la empresa para permitir sync
    await db.meta.put({ key: 'empresaId', value: testEmpresa.id });

    // 1. Aseguramos que haya al menos 1 producto y 1 usuario en PostgreSQL vinculados a testEmpresa
    const userCount = await prisma.user.count({ where: { role: Role.CAJERO, empresa_id: testEmpresa.id } });
    if (userCount === 0) {
      await prisma.user.create({
        data: {
          name: 'Test Cajero Integra',
          email: 'integra@cajero.com',
          role: Role.CAJERO,
          pin_hash: 'dummyhash',
          empresa_id: testEmpresa.id,
        }
      });
    }

    const prodCount = await prisma.producto.count({ where: { empresa_id: testEmpresa.id } });
    if (prodCount === 0) {
      await prisma.producto.create({
        data: {
          nombre: 'Test Producto Integra',
          codigo_interno: 'INT-01',
          precio_publico: 100,
          costo: 50,
          empresa_id: testEmpresa.id,
        }
      });
    }
    
    // Sucursal vinculada a testEmpresa
    const branchCount = await prisma.sucursal.count({ where: { empresa_id: testEmpresa.id } });
    let branch;
    if (branchCount === 0) {
      branch = await prisma.sucursal.create({
        data: { id: "branch-1", nombre: "Sucursal Integra", empresa_id: testEmpresa.id }
      });
    } else {
      branch = await prisma.sucursal.findFirst({ where: { empresa_id: testEmpresa.id } });
    }

    // Le damos stock para que la sucursal tenga inventario
    const testProd = await prisma.producto.findFirst({ where: { empresa_id: testEmpresa.id } });
    if (testProd && branch) {
      const invCount = await prisma.inventario_Sucursal.count({
        where: { sucursal_id: branch.id, producto_id: testProd.id }
      });
      if (invCount === 0) {
        await prisma.inventario_Sucursal.create({
          data: {
            producto_id: testProd.id,
            sucursal_id: branch.id,
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
