import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../lib/db';
import { pullFromCloud } from '../../lib/sync';
import { db as prisma, Role } from '@shopli/db';

import { generateTestPosToken } from './test-token-helper';

describe('pullFromCloud integration', () => {

  beforeAll(async () => {
    // Definimos la variable global para apiClient.ts
    vi.stubGlobal('import.meta', {
      env: {
        VITE_API_BASE_URL: 'http://localhost:3000/api',
      }
    });

    // Ensure test Empresa exists safely without concurrency race conditions
    let testEmpresa = await prisma.empresa.findUnique({ where: { id: 'test-empresa-id' } });
    if (!testEmpresa) {
      try {
        testEmpresa = await prisma.empresa.create({
          data: {
            id: 'test-empresa-id',
            nombre: 'Test Empresa',
            tokenVersion: 1,
          }
        });
      } catch (_) {
        testEmpresa = await prisma.empresa.findUnique({ where: { id: 'test-empresa-id' } });
      }
    }

    if (!testEmpresa) {
      throw new Error('No se pudo inicializar la empresa de prueba');
    }

    // Configurar Dexie con la empresa y el syncToken firmado
    const testSyncToken = generateTestPosToken({
      empresa_id: testEmpresa.id,
      user_id: 'test-user-id',
      role: 'CAJERO',
      tokenVersion: testEmpresa.tokenVersion || 1,
    });

    await db.meta.put({ key: 'empresaId', value: testEmpresa.id });
    await db.meta.put({ key: 'syncToken', value: testSyncToken });

    // 1. Aseguramos que haya al menos 1 producto y 1 usuario en PostgreSQL vinculados a testEmpresa con UUID válido
    const userCount = await prisma.user.count({ where: { role: Role.CAJERO, empresa_id: testEmpresa.id } });
    if (userCount === 0) {
      await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Test Cajero Integra',
          email: `integra-${Date.now()}@cajero.com`,
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
          id: crypto.randomUUID(),
          nombre: 'Test Producto Integra',
          codigo_interno: `INT-${Date.now()}`,
          precio_publico: 100,
          costo: 50,
          empresa_id: testEmpresa.id,
        }
      });
    }
    
    // Sucursal vinculada a testEmpresa con UUID válido
    let branch = await prisma.sucursal.findFirst({ where: { empresa_id: testEmpresa.id } });
    if (!branch) {
      branch = await prisma.sucursal.create({
        data: { id: crypto.randomUUID(), nombre: "Sucursal Integra", empresa_id: testEmpresa.id }
      });
    }

    // Le damos stock de forma atómica con upsert
    const testProd = await prisma.producto.findFirst({ where: { empresa_id: testEmpresa.id } });
    if (testProd && branch) {
      await prisma.inventario_Sucursal.upsert({
        where: { sucursal_id_producto_id: { sucursal_id: branch.id, producto_id: testProd.id } },
        update: { cantidad: 10 },
        create: {
          producto_id: testProd.id,
          sucursal_id: branch.id,
          cantidad: 10
        }
      });
    }
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
  });

  it('debe barrer la base de datos local y poblarla con los datos traidos de PostgreSQL', async () => {
    // 2. Limpiamos la base local de Dexie pero mantenemos la empresa y token configurados
    const syncToken = (await db.meta.get('syncToken'))?.value;
    await db.products.clear();
    await db.users.clear();
    await db.meta.clear();
    await db.meta.put({ key: 'empresaId', value: 'test-empresa-id' });
    if (syncToken) {
      await db.meta.put({ key: 'syncToken', value: syncToken });
    }
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

  it('debe purgar atómicamente de Dexie y del carrito un producto que se desactiva en la nube (incremental sync)', async () => {
    // 1. Creamos un producto activo en PostgreSQL para testEmpresa
    const prodId = crypto.randomUUID();
    await prisma.producto.create({
      data: {
        id: prodId,
        nombre: 'Producto a Desactivar',
        codigo_interno: `TO-DEACT-${Date.now()}`,
        precio_publico: 150,
        costo: 80,
        isActive: true,
        empresa_id: 'test-empresa-id',
      },
    });

    // Sincronizamos para que baje a Dexie
    await pullFromCloud();
    const prodInDexie = await db.products.get(prodId);
    expect(prodInDexie).toBeDefined();
    expect(prodInDexie?.id).toBe(prodId);

    // Lo agregamos al carrito local
    await db.cart.add({
      id: crypto.randomUUID(),
      producto_id: prodId,
      name: 'Producto a Desactivar',
      price: 150,
      precio_mayoreo: null,
      min_cantidad_mayoreo: null,
      quantity: 1,
      descuento_manual: 0,
      nota_descuento: '',
      parent_id: null,
      variante_nombre: null,
    });
    expect(await db.cart.where('producto_id').equals(prodId).count()).toBe(1);

    // 2. Desactivamos el producto en PostgreSQL
    await new Promise((r) => setTimeout(r, 10)); // Breve pausa para asegurar updatedAt > lastSyncedAt
    await prisma.producto.update({
      where: { id: prodId },
      data: { isActive: false },
    });

    // 3. Ejecutamos pull incremental
    const pullResult = await pullFromCloud();
    expect(pullResult.source).toBe('cloud');

    // 4. Verificamos que se purgó tanto de db.products como de db.cart
    const prodAfterPurge = await db.products.get(prodId);
    expect(prodAfterPurge).toBeUndefined();

    const cartAfterPurge = await db.cart.where('producto_id').equals(prodId).first();
    expect(cartAfterPurge).toBeUndefined();
  });

  it('debe purgar atómicamente de Dexie un cajero que se desactiva en la nube (incremental sync)', async () => {
    // 1. Creamos un cajero activo en PostgreSQL
    const userId = crypto.randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Cajero a Desactivar',
        email: `cajero-deact-${Date.now()}@test.com`,
        role: Role.CAJERO,
        pin_hash: 'dummyhash',
        active: true,
        empresa_id: 'test-empresa-id',
      },
    });

    // Sincronizamos para que baje a Dexie
    await pullFromCloud();
    const userInDexie = await db.users.get(userId);
    expect(userInDexie).toBeDefined();
    expect(userInDexie?.id).toBe(userId);

    // 2. Desactivamos el usuario en PostgreSQL
    await new Promise((r) => setTimeout(r, 10));
    await prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });

    // 3. Ejecutamos pull incremental
    const pullResult = await pullFromCloud();
    expect(pullResult.source).toBe('cloud');

    // 4. Verificamos que se purgó de db.users
    const userAfterPurge = await db.users.get(userId);
    expect(userAfterPurge).toBeUndefined();
  });
});
