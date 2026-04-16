import { db } from './db';
import { apiClient } from './api-client';

export type PushResult = {
  success: boolean;
  reason?: string;
  pushed?: {
    turnos: number;
    ventas: number;
    auditorias: number;
    gastos: number;
  };
};

export async function buildPushPayload() {
  // Extraemos todos los registros con sync_status === 'PENDING'
  const pendingTurnos = await db.turnos.where('sync_status').equals('PENDING').toArray();
  const pendingSales = await db.sales.where('sync_status').equals('PENDING').toArray();
  const pendingAudits = await db.audits.where('sync_status').equals('PENDING').toArray();
  const pendingGastos = await db.gastos.where('sync_status').equals('PENDING').toArray();
  const pendingDynamicAudits = await db.dynamicAudits.where('sync_status').equals('PENDING').toArray();

  // Enriquecemos cada venta con sus detalles asociados mediante una consulta adicional a sale_details
  const ventas = await Promise.all(
    pendingSales.map(async (sale) => {
      const details = await db.sale_details.where('venta_id').equals(sale.id).toArray();
      return {
         id: sale.id,
         turno_id: sale.turno_id,
         sucursal_id: sale.sucursal_id,
         total: sale.total,
         estado: sale.estado,
         fecha: sale.fecha,
         detalles: details.map(d => ({
           producto_id: d.producto_id,
           cantidad: d.cantidad,
           precio_unitario_historico: d.precio_unitario_historico
         }))
      };
    })
  );

  const turnos = pendingTurnos.map(t => ({
      id: t.id,
      usuario_id: t.usuario_id,
      sucursal_id: t.sucursal_id,
      estado: t.estado,
      monto_inicial: t.monto_inicial,
      monto_final: t.monto_final,
      total_ventas: t.total_ventas,
      fecha_apertura: t.fecha_apertura,
      fecha_cierre: t.fecha_cierre
  }));

  const auditorias = pendingAudits.map(a => ({
      id: a.id,
      shiftId: a.shiftId,
      userId: a.userId,
      branchId: a.branchId,
      createdAt: a.createdAt,
      items: a.items // Los items están embebidos en la entidad local gracias al diseño offline
  }));

  const gastos = pendingGastos.map(g => ({
      id: g.id,
      turno_id: g.turno_id,
      sucursal_id: g.sucursal_id,
      categoria: g.categoria,
      monto: g.monto,
      descripcion: g.descripcion,
      fecha: g.fecha,
      proveedor_id: g.proveedor_id
  }));

  const branchInfo = await db.branches.limit(1).first();
  const branchId = branchInfo ? branchInfo.id : '';

  const auditoriasDinamicas = await Promise.all(
    pendingDynamicAudits.map(async (da) => {
      const items = await db.dynamicAuditItems.where('auditId').equals(da.id).toArray();
      return {
        id: da.id,
        sucursal_id: branchId,
        startedAt: da.startedAt,
        items: items.map(item => ({
          productId: item.productId,
          countedQuantity: item.countedQuantity,
          countedAt: item.countedAt,
        }))
      };
    })
  );

  return { turnos, ventas, auditorias, gastos, auditoriasDinamicas };
}

export async function pushToCloud(): Promise<PushResult> {
  // Comprobación rápida para prevenir llamadas innecesarias si el dispositivo reporta offline
  if (!navigator.onLine) {
    return { success: false, reason: 'offline' };
  }

  try {
    const payload = await buildPushPayload();
    
    // Optimizamos cortando la sincronización si no hay nada pendiente
    if (payload.turnos.length === 0 && payload.ventas.length === 0 && payload.auditorias.length === 0 && payload.gastos.length === 0 && payload.auditoriasDinamicas.length === 0) {
       return { success: true, pushed: { turnos: 0, ventas: 0, auditorias: 0, gastos: 0 } }; // Also we can add auditoriasDinamicas here if needed
    }

    const secret = import.meta.env.VITE_POS_SYNC_SECRET || '';
    
    // Hacemos el fetch POST al BFF con el secret injectado por headers a través del proxy
    const data = await apiClient<any>('pos/sync/push', {
      method: 'POST',
      headers: {
        'x-pos-sync-secret': secret
      },
      body: payload
    });

    // Reconciliación Local (ACK). Si es 200 OK, procedemos a marcar como 'SYNCED'
    if (data.success && data.procesados) {
       const { turnos: procTurnos = [], ventas: procVentas = [], auditorias: procAuditorias = [], gastos: procGastos = [], auditoriasDinamicas: procAuditoriasDinamicas = [] } = data.procesados;
       
       await db.transaction('rw', [db.turnos, db.sales, db.audits, db.gastos, db.dynamicAudits, db.dynamicAuditItems], async () => {
          // Operaciones masivas usando Dexie modify() lo cual es muy performance friendly.
          if (procTurnos.length > 0) {
             await db.turnos.where('id').anyOf(procTurnos).modify({ sync_status: 'SYNCED' });
          }
          if (procVentas.length > 0) {
             await db.sales.where('id').anyOf(procVentas).modify({ sync_status: 'SYNCED' });
          }
          if (procAuditorias.length > 0) {
             await db.audits.where('id').anyOf(procAuditorias).modify({ sync_status: 'SYNCED' });
          }
          if (procGastos.length > 0) {
             await db.gastos.where('id').anyOf(procGastos).modify({ sync_status: 'SYNCED' });
          }
          if (procAuditoriasDinamicas.length > 0) {
             // Marca las cabeceras como SYNCED
             await db.dynamicAudits.where('id').anyOf(procAuditoriasDinamicas).modify({ sync_status: 'SYNCED' });
             // Marca todos los items de esas auditorias como SYNCED
             const itemsPorActualizar = await db.dynamicAuditItems.where('auditId').anyOf(procAuditoriasDinamicas).primaryKeys();
             if (itemsPorActualizar.length > 0) {
               await db.dynamicAuditItems.where('id').anyOf(itemsPorActualizar).modify({ sync_status: 'SYNCED' });
             }
          }
       });

       return {
         success: true,
         pushed: {
           turnos: procTurnos.length,
           ventas: procVentas.length,
           auditorias: procAuditorias.length,
           gastos: procGastos.length
         }
       };
    } else {
       return { success: false, reason: 'invalid_response' };
    }

  } catch (error: any) {
    // Manejo de errores de red precisos (Ej: Cuando el fetch colapsa por red no disponible)
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
       return { success: false, reason: 'offline' };
    }
    console.error("Push sync exception:", error);
    return { success: false, reason: error.message || String(error) };
  }
}
