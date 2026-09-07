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

    const empresaRecord = await db.meta.get('empresaId');
    const empresaId = empresaRecord ? empresaRecord.value : null;

    if (!empresaId) {
      console.warn('Sincronización cancelada: Dispositivo no configurado con una Empresa.');
      return { source: 'cache' };
    }

    const syncTokenRecord = await db.meta.get('syncToken');
    const syncToken = syncTokenRecord?.value;

    const secret = import.meta.env.VITE_SYNC_SECRET || '';
    const params: Record<string, string> = {};
    if (lastSyncedAt) {
      params.updatedAfter = lastSyncedAt;
    }

    // Si aún no hay Bearer token pero existe secret legado, enviarlo como fallback
    if (!syncToken && secret) {
      params.secret = secret;
      params.empresaId = empresaId;
    }

    const headers: Record<string, string> = {};
    if (syncToken) {
      headers['Authorization'] = `Bearer ${syncToken}`;
    } else if (secret) {
      headers['x-pos-sync-secret'] = secret;
    }

    const endpoint = `pos/sync/pull`;

    let data: PullSyncResponse;
    try {
      data = await apiClient<PullSyncResponse>(endpoint, {
        method: 'GET',
        params,
        headers,
      });
      // Si la petición tuvo éxito, aseguramos limpiar cualquier bandera previa
      await db.meta.put({ key: 'subscriptionSuspended', value: false });
      await db.meta.put({ key: 'tokenRevoked', value: false });
    } catch (error: any) {
      if (error?.status === 401 && (error?.data?.error === 'TOKEN_REVOKED' || error?.message?.includes('revocado'))) {
        console.warn('⚠️ Token POS revocado por el servidor (HTTP 401 TOKEN_REVOKED). Bloqueando terminal.');
        await db.meta.put({ key: 'tokenRevoked', value: true });
        return { source: 'cache' };
      }

      if (error?.status === 402 || error?.isSubscriptionSuspended) {
        console.warn('⚠️ Suscripción de empresa suspendida (HTTP 402). Activando pantalla de bloqueo.');
        await db.meta.put({ key: 'subscriptionSuspended', value: true });
        return { source: 'cache' };
      }
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
             precio_mayoreo: p.precioMayoreo ? Number(p.precioMayoreo) : null,
             min_cantidad_mayoreo: p.minCantidadMayoreo ? Number(p.minCantidadMayoreo) : null,
             categoria: p.category,
             isCritical: false, // Ahora se puede calcular mediante cruce local
             isActive: true, // El endpoint solo devuelve productos activos
             parent_id: p.parentId || null,
             variante_nombre: p.varianteNombre || null,
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
              precio_mayoreo: p.precioMayoreo ? Number(p.precioMayoreo) : null,
              min_cantidad_mayoreo: p.minCantidadMayoreo ? Number(p.minCantidadMayoreo) : null,
              categoria: p.category,
              isCritical: false,
              isActive: true, // El endpoint solo devuelve productos activos
              parent_id: p.parentId || null,
              variante_nombre: p.varianteNombre || null,
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

      // 2. Actualizamos lastSyncedAt y lastOnlineVerification
      if (data.syncedAt) {
        await db.meta.put({ key: 'lastSyncedAt', value: data.syncedAt });
      }
      await db.meta.put({ key: 'lastOnlineVerification', value: new Date().toISOString() });
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
