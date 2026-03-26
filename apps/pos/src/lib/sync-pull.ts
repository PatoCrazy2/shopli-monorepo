import { db } from './db';
import { apiClient } from './api-client';

export type SyncResult = {
  source: 'cloud' | 'cache';
  count?: { products: number; users: number };
};

export type PullSyncResponse = {
  products?: any[];
  users?: any[];
  branches?: any[];
  syncedAt?: string;
};

export async function pullFromCloud(): Promise<SyncResult> {
  try {
    const metaRecord = await db.meta.get('lastSyncedAt');
    const lastSyncedAt = metaRecord ? metaRecord.value : null;

    // Pasar el secret como query param — no dispara CORS preflight a diferencia de headers personalizados
    const secret = import.meta.env.VITE_SYNC_SECRET || '';
    const params = new URLSearchParams({ secret });
    if (lastSyncedAt) {
      params.set('updatedAfter', lastSyncedAt);
    }
    const endpoint = `pos/sync/pull?${params.toString()}`;

    let data: PullSyncResponse;
    try {
      data = await apiClient<PullSyncResponse>(endpoint, {
        method: 'GET',
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
             isCritical: p.stock <= 5,
             isActive: true, // El endpoint solo devuelve productos activos
             updatedAt: p.updatedAt
          }));
          await db.products.bulkAdd(productsToAdd);

          const defaultBranchId = data.branches && data.branches.length > 0 ? data.branches[0].id : 'default';

          const invToAdd = data.products.map((p: any) => ({
             id: crypto.randomUUID(),
             sucursal_id: defaultBranchId, 
             producto_id: p.id,
             cantidad: p.stock,
             updatedAt: p.updatedAt
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
              isCritical: p.stock <= 5,
              isActive: true, // El endpoint solo devuelve productos activos
              updatedAt: p.updatedAt
            }))
           );
           
           const currentBranch = await db.branches.toCollection().first();
           const branchIdToUse = (data.branches && data.branches.length > 0) ? data.branches[0].id : (currentBranch?.id || 'default');

           // Upsert inventory
           await db.inventory.bulkPut(
             data.products.map((p: any) => ({
                id: p.id, // Forzamos ID a ser P.id para mantener unicidad en incremental
                sucursal_id: branchIdToUse, 
                producto_id: p.id,
                cantidad: p.stock,
                updatedAt: p.updatedAt
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
