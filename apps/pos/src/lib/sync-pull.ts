import { db } from './db';
import { apiClient } from './api-client';

export type SyncResult = {
  source: 'cloud' | 'cache';
  count?: { products: number; users: number };
};

export type PullSyncResponse = {
  products?: any[];
  inventory?: any[];
  users?: any[];
  branches?: any[];
  syncedAt?: string;
};

export async function pullFromCloud(): Promise<SyncResult> {
  try {
    const metaRecord = await db.meta.get('lastSyncedAt');
    const lastSyncedAt = metaRecord ? metaRecord.value : null;

    const secret = import.meta.env.VITE_SYNC_SECRET || '';
    const params: Record<string, string> = { secret };
    if (lastSyncedAt) {
      params.updatedAfter = lastSyncedAt;
    }
    const endpoint = `pos/sync/pull`;

    let data: PullSyncResponse;
    try {
      data = await apiClient<PullSyncResponse>(endpoint, {
        method: 'GET',
        params // Pass params to apiClient
      });
    } catch (error: any) {
      // Offline o error de servidor (500)
      console.warn('Fallo la conexión con el servidor al sincronizar en el POS:', error.status || error);
      return { source: 'cache' };
    }
    
    await db.transaction("rw", [db.products, db.users, db.meta, db.inventory, db.branches], async () => {
      // 1. Si no hay lastSyncedAt, es carga completa: Limpiamos y metemos todo de golpe.
      if (!lastSyncedAt) {
        await db.products.clear();
        await db.users.clear();
        await db.inventory.clear(); // Opcional, pero recomendado si se trae el stock total
        await db.branches.clear();
  
        // Inyectamos usuarios recibidos: mapping a modelo local LocalUser
        if (data.users && data.users.length > 0) {
          await db.users.bulkAdd(
            data.users.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email || '',
              role: u.role,
              pin: u.pin_hash || null,
            }))
          );
        }

        // Inyectamos sucursales recibidos: mapping a modelo local LocalBranch
        if (data.branches && data.branches.length > 0) {
          await db.branches.bulkAdd(
            data.branches.map((b: any) => ({
              id: b.id,
              nombre: b.name,
              direccion: b.address,
              updatedAt: b.updatedAt
            }))
          );
        }
  
        // Inyectamos productos recibidos: mapping a modelo local LocalProduct y LocalInventory
        if (data.products && data.products.length > 0) {
          const productsToAdd = data.products.map((p: any) => ({
             id: p.id,
             nombre: p.name,
             codigo_interno: p.sku,
             descripcion: null,
             costo: p.price,
             precio_publico: p.price,
             categoria: p.category,
             isCritical: false, // Ahora se puede calcular mediante cruce local
             isActive: true, // El endpoint solo devuelve productos activos
             updatedAt: p.updatedAt
          }));
          await db.products.bulkAdd(productsToAdd);
        }

        // Inyectamos el stock disgregado real de Inventario_Sucursal
        if (data.inventory && data.inventory.length > 0) {
          const invToAdd = data.inventory.map((inv: any) => ({
             id: inv.id,
             sucursal_id: inv.branchId, 
             producto_id: inv.productId,
             cantidad: inv.stock,
             updatedAt: inv.updatedAt
          }));
          await db.inventory.bulkAdd(invToAdd);
        }
      } else {
        // Carga incremental: usamos upserts (bulkPut).
        if (data.users && data.users.length > 0) {
           await db.users.bulkPut(
            data.users.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email || '',
              role: u.role,
              pin: u.pin_hash || null,
            }))
          );
        }

        if (data.branches && data.branches.length > 0) {
           await db.branches.bulkPut(
            data.branches.map((b: any) => ({
              id: b.id,
              nombre: b.name,
              direccion: b.address,
              updatedAt: b.updatedAt
            }))
          );
        }

        if (data.products && data.products.length > 0) {
           await db.products.bulkPut(
            data.products.map((p: any) => ({
              id: p.id,
              nombre: p.name,
              codigo_interno: p.sku,
              descripcion: null,
              costo: p.price,
              precio_publico: p.price,
              categoria: p.category,
              isCritical: false,
              isActive: true, // El endpoint solo devuelve productos activos
              updatedAt: p.updatedAt
            }))
           );
        }

        if (data.inventory && data.inventory.length > 0) {
           await db.inventory.bulkPut(
             data.inventory.map((inv: any) => ({
                id: inv.id, 
                sucursal_id: inv.branchId, 
                producto_id: inv.productId,
                cantidad: inv.stock,
                updatedAt: inv.updatedAt
             }))
           );
        }

        // Si tuvieramos data.deletedProductIds, haríamos db.products.bulkDelete(data.deletedProductIds) etc.
      }

      // 2. Acutalizamos lastSyncedAt
      if (data.syncedAt) {
        await db.meta.put({ key: 'lastSyncedAt', value: data.syncedAt });
      }
    });

    return { 
      source: 'cloud', 
      count: { 
        products: data.products?.length || 0, 
        users: data.users?.length || 0 
      } 
    };

  } catch (error) {
    console.warn('Error al intentar realizar el pull de datos desde la nube.', error);
    return { source: 'cache' }; // Fallback silencioso
  }
}
