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
    auditoriasDinamicas: number;
  };
};

export async function buildPushPayload() {
  // Extraemos todos los registros con sync_status === 'PENDING'
  const pendingTurnos = await db.turnos.where('sync_status').equals('PENDING').toArray();
  const pendingSales = await db.sales.where('sync_status').equals('PENDING').toArray();
  const pendingAudits = await db.audits.where('sync_status').equals('PENDING').toArray();
  const pendingGastos = await db.gastos.where('sync_status').equals('PENDING').toArray();
  const pendingDynamicAudits = await db.dynamicAudits.where('sync_status').equals('PENDING').toArray();
  const pendingDynamicAuditItems = await db.dynamicAuditItems.where('sync_status').equals('PENDING').toArray();

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
          precio_unitario_historico: d.precio_unitario_historico,
          descuento_manual: d.descuento_manual || 0,
          nota_descuento: d.nota_descuento || null
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

  // Agrupamos ítems pendientes por auditId y unificamos con las cabeceras pendientes
  // para que ítems contados después de sincronizar la cabecera siempre se envíen.
  const pendingItemsByAuditId = new Map<string, typeof pendingDynamicAuditItems>();
  for (const item of pendingDynamicAuditItems) {
    const list = pendingItemsByAuditId.get(item.auditId) ?? [];
    list.push(item);
    pendingItemsByAuditId.set(item.auditId, list);
  }

  const targetAuditIds = new Set<string>([
    ...pendingDynamicAudits.map(da => da.id),
    ...pendingItemsByAuditId.keys()
  ]);

  const pendingAuditMap = new Map(pendingDynamicAudits.map(da => [da.id, da]));
  const auditoriasDinamicas: Array<{
    id: string;
    sucursal_id: string;
    startedAt: string;
    finishedAt: string | null;
    iniciadaPorId: string | null;
    finalizadaPorId: string | null;
    items: Array<{
      id: string;
      productId: string;
      countedQuantity: number | null;
      countedAt: string | null;
      contadoPorId: string | null;
    }>;
  }> = [];

  for (const auditId of targetAuditIds) {
    const da = pendingAuditMap.get(auditId) ?? (await db.dynamicAudits.get(auditId));
    if (!da) continue;

    const items = pendingItemsByAuditId.get(da.id) ?? [];
    auditoriasDinamicas.push({
      id: da.id,
      sucursal_id: da.branchId,
      startedAt: da.startedAt,
      finishedAt: da.finishedAt ?? null,
      iniciadaPorId: da.iniciadaPorId ?? null,
      finalizadaPorId: da.finalizadaPorId ?? null,
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        countedQuantity: item.countedQuantity,
        countedAt: item.countedAt,
        contadoPorId: item.contadoPorId ?? null,
      }))
    });
  }

  return { turnos, ventas, auditorias, gastos, auditoriasDinamicas };
}

export async function pushToCloud(): Promise<PushResult> {
  // Comprobación rápida para prevenir llamadas innecesarias si el dispositivo reporta offline
  if (!navigator.onLine) {
    return { success: false, reason: 'offline' };
  }

  try {
    const empresaRecord = await db.meta.get('empresaId');
    const empresaId = empresaRecord ? empresaRecord.value : null;
    if (!empresaId) {
      return { success: false, reason: 'unconfigured_device' };
    }

    const payload = await buildPushPayload();

    // Optimizamos cortando la sincronización si no hay nada pendiente
    if (
      payload.turnos.length === 0 &&
      payload.ventas.length === 0 &&
      payload.auditorias.length === 0 &&
      payload.gastos.length === 0 &&
      payload.auditoriasDinamicas.length === 0
    ) {
      return {
        success: true,
        pushed: { turnos: 0, ventas: 0, auditorias: 0, gastos: 0, auditoriasDinamicas: 0 }
      };
    }

    // Snapshot de versiones enviadas para reconciliación ACK segura ante escrituras en vuelo
    const sentHeaderState = new Map(
      payload.auditoriasDinamicas.map(da => [
        da.id,
        { finishedAt: da.finishedAt ?? null, finalizadaPorId: da.finalizadaPorId ?? null }
      ])
    );
    const sentItemCountedAt = new Map<string, string | null>();
    for (const da of payload.auditoriasDinamicas) {
      for (const item of da.items) {
        sentItemCountedAt.set(item.id, item.countedAt);
      }
    }

    const syncTokenRecord = await db.meta.get('syncToken');
    const syncToken = syncTokenRecord?.value;

    const secret = import.meta.env.VITE_SYNC_SECRET || import.meta.env.VITE_POS_SYNC_SECRET || '';

    const params: Record<string, string> = {};
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

    // Hacemos el fetch POST al BFF con Bearer Token o fallback
    const data = await apiClient<any>('pos/sync/push', {
      method: 'POST',
      params,
      headers,
      body: payload
    });

    // Reconciliación Local (ACK). Si es 200 OK, procedemos a marcar como 'SYNCED'
    if (data.success && data.procesados) {
      // Limpiar banderas de suspensión y revocación si hubo éxito
      await db.meta.put({ key: 'subscriptionSuspended', value: false });
      await db.meta.put({ key: 'tokenRevoked', value: false });

      const {
        turnos: procTurnos = [],
        ventas: procVentas = [],
        auditorias: procAuditorias = [],
        gastos: procGastos = [],
        auditoriasDinamicas: procAuditoriasDinamicas = []
      } = data.procesados;

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
          const procAuditSet = new Set<string>(procAuditoriasDinamicas);

          // Marca las cabeceras como SYNCED solo si no cambiaron (ej. finalizadas) mientras el request estaba en vuelo
          await db.dynamicAudits
            .where('id')
            .anyOf(procAuditoriasDinamicas)
            .modify((audit) => {
              const sent = sentHeaderState.get(audit.id);
              if (
                sent &&
                (audit.finishedAt ?? null) === sent.finishedAt &&
                (audit.finalizadaPorId ?? null) === sent.finalizadaPorId
              ) {
                audit.sync_status = 'SYNCED';
              }
            });

          // Marca únicamente los ítems que fueron enviados en este lote y cuyo countedAt no fue modificado en vuelo
          const sentItemIdsForProcessedAudits: string[] = [];
          for (const da of payload.auditoriasDinamicas) {
            if (procAuditSet.has(da.id)) {
              for (const item of da.items) {
                sentItemIdsForProcessedAudits.push(item.id);
              }
            }
          }

          if (sentItemIdsForProcessedAudits.length > 0) {
            await db.dynamicAuditItems
              .where('id')
              .anyOf(sentItemIdsForProcessedAudits)
              .modify((item) => {
                if (sentItemCountedAt.get(item.id) === item.countedAt) {
                  item.sync_status = 'SYNCED';
                }
              });
          }
        }
      });

      await db.meta.put({ key: 'lastOnlineVerification', value: new Date().toISOString() });

      return {
        success: true,
        pushed: {
          turnos: procTurnos.length,
          ventas: procVentas.length,
          auditorias: procAuditorias.length,
          gastos: procGastos.length,
          auditoriasDinamicas: procAuditoriasDinamicas.length
        }
      };
    } else {
      return { success: false, reason: 'invalid_response' };
    }

  } catch (error: any) {
    if (error?.status === 401 && (error?.data?.error === 'TOKEN_REVOKED' || error?.message?.includes('revocado'))) {
      console.warn('⚠️ Token POS revocado durante Push (HTTP 401 TOKEN_REVOKED). Bloqueando terminal.');
      await db.meta.put({ key: 'tokenRevoked', value: true });
      return { success: false, reason: 'token_revoked' };
    }

    if (error?.status === 402 || error?.isSubscriptionSuspended) {
      console.warn('⚠️ Suscripción de empresa suspendida durante Push (HTTP 402).');
      await db.meta.put({ key: 'subscriptionSuspended', value: true });
      return { success: false, reason: 'subscription_suspended' };
    }

    // Manejo de errores de red precisos (Ej: Cuando el fetch colapsa por red no disponible)
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
      return { success: false, reason: 'offline' };
    }
    console.error("Push sync exception:", error);
    return { success: false, reason: error.message || String(error) };
  }
}
