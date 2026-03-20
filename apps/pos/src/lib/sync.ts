import { db } from './db';
import { apiClient } from './api-client';

// Tipos para pushToCloud
export type PushResult = {
  pushed: number;
  failed: number;
  offline?: boolean;
  errors?: any[];
};

// Tipo que simula la respuesta que viene de PullSyncResponse
export type SyncResult = {
  source: 'cloud' | 'cache';
  count?: { products: number; users: number };
};

// Tipos de respuesta de la API para el cliente HTTP tipado
export type PullSyncResponse = {
  products?: any[];
  users?: any[];
  branches?: any[];
  syncedAt?: string;
};

export type PushSyncResponse = {
  inserted: number;
  failed: number;
  results: Array<{ localId: string; serverId: string | null; status: 'ok' | 'error'; reason?: string }>;
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

          // También mapear el inventario total recibido para la sucursal activa
          // Asumiremos branch-1 como main por el momento en base al mock existente
          const invToAdd = data.products.map((p: any) => ({
             id: crypto.randomUUID(),
             sucursal_id: 'branch-1', 
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
           
           // Upsert inventory
           await db.inventory.bulkPut(
             data.products.map((p: any) => ({
                id: p.id, // Forzamos ID a ser P.id para mantener unicidad en incremental mock (idealmente compuesto o actualizamos basado en FK)
                sucursal_id: 'branch-1', 
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

export async function pushToCloud(cashierId: string): Promise<PushResult> {
  if (!navigator.onLine) {
    return { pushed: 0, failed: 0, offline: true };
  }

  try {
    // 1. Obtener ventas pendientes con límite para no ahogar el payload
    const pendingSales = await db.sales.limit(50).toArray();
    
    if (pendingSales.length === 0) {
      return { pushed: 0, failed: 0 };
    }

    // 2. Construir el payload obteniendo los items de la base de dexie para cada venta
    const salesPayload = await Promise.all(
      pendingSales.map(async (sale) => {
        const items = await db.sale_details.where('venta_id').equals(sale.id).toArray();
        return {
          localId: sale.id,
          items: items.map(item => ({
            productId: item.producto_id,
            quantity: item.cantidad,
            unitPrice: item.precio_unitario_historico
          })),
          total: sale.total,
          createdAt: sale.fecha
        };
      })
    );

    let data: PushSyncResponse;
    try {
      // 3. Efectuar el Fetch POST usando apiClient
      data = await apiClient<PushSyncResponse>('pos/sync/push', {
        method: 'POST',
        body: {
          cashierId,
          sales: salesPayload
        }
      });
    } catch (error: any) {
      console.warn('Fallo el Push al Cloud:', error.message || error);
      return { pushed: 0, failed: salesPayload.length, offline: true };
    }

    // 4. Filtrar exitosos y borrar de Dexie
    const okIds = data.results.filter(r => r.status === 'ok').map(r => r.localId);

    if (okIds.length > 0) {
      await db.transaction('rw', db.sales, db.sale_details, async () => {
        // Borramos las órdenes (ventas)
        await db.sales.bulkDelete(okIds);
        
        // Localizamos detalles relacionados a esos IDs OK y los limpiamos
        const detailsKeys = await db.sale_details.where('venta_id').anyOf(okIds).primaryKeys();
        await db.sale_details.bulkDelete(detailsKeys as string[]);
      });
    }

    return {
      pushed: okIds.length,
      failed: (pendingSales.length - okIds.length),
      errors: data.results.filter(r => r.status === 'error')
    };

  } catch (error) {
    console.warn('Error/Excepcion aislada durante el Push de Sincronizacion', error);
    return { pushed: 0, failed: 0, offline: true };
  }
}
