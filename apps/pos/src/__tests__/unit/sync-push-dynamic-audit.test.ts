import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../../lib/db";
import { buildPushPayload, pushToCloud } from "../../lib/sync-push";
import * as apiClientModule from "../../lib/api-client";

describe("sync-push - Auditorías Dinámicas (Empaquetado por Ítems y ACK Concurrency-Safe)", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await db.turnos.clear();
    await db.sales.clear();
    await db.sale_details.clear();
    await db.audits.clear();
    await db.gastos.clear();
    await db.dynamicAudits.clear();
    await db.dynamicAuditItems.clear();
    await db.meta.clear();

    await db.meta.put({ key: "empresaId", value: "emp-123" });
    await db.meta.put({ key: "syncToken", value: "token-pos-test" });
    Object.defineProperty(globalThis.navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  it("1. Incluye la auditoría cuando la cabecera ya está SYNCED pero tiene ítems PENDING", async () => {
    const auditId = crypto.randomUUID();
    await db.dynamicAudits.add({
      id: auditId,
      branchId: "branch-1",
      startedAt: "2026-10-09T10:00:00.000Z",
      finishedAt: null,
      status: "OPEN",
      iniciadaPorId: "user-1",
      finalizadaPorId: null,
      sync_status: "SYNCED", // Ya sincronizada previamente
    });

    await db.dynamicAuditItems.bulkAdd([
      {
        id: "item-synced",
        auditId,
        productId: "prod-1",
        countedQuantity: 10,
        countedAt: "2026-10-09T10:01:00.000Z",
        contadoPorId: "user-1",
        sync_status: "SYNCED",
      },
      {
        id: "item-pending",
        auditId,
        productId: "prod-2",
        countedQuantity: 25,
        countedAt: "2026-10-09T10:02:00.000Z",
        contadoPorId: "user-2",
        sync_status: "PENDING",
      },
    ]);

    const payload = await buildPushPayload();

    expect(payload.auditoriasDinamicas).toHaveLength(1);
    expect(payload.auditoriasDinamicas[0]).toMatchObject({
      id: auditId,
      sucursal_id: "branch-1",
      startedAt: "2026-10-09T10:00:00.000Z",
      finishedAt: null,
      iniciadaPorId: "user-1",
      finalizadaPorId: null,
    });
    // Solo se envía el ítem PENDING, no el que ya estaba SYNCED
    expect(payload.auditoriasDinamicas[0].items).toHaveLength(1);
    expect(payload.auditoriasDinamicas[0].items[0]).toEqual({
      id: "item-pending",
      productId: "prod-2",
      countedQuantity: 25,
      countedAt: "2026-10-09T10:02:00.000Z",
      contadoPorId: "user-2",
    });
  });

  it("2. ACK marca solo los ítems enviados: un ítem capturado o re-contado mientras la petición está en vuelo sigue PENDING", async () => {
    const auditId = crypto.randomUUID();
    await db.dynamicAudits.add({
      id: auditId,
      branchId: "branch-1",
      startedAt: "2026-10-09T10:00:00.000Z",
      finishedAt: null,
      status: "OPEN",
      iniciadaPorId: "user-1",
      finalizadaPorId: null,
      sync_status: "SYNCED",
    });

    await db.dynamicAuditItems.bulkAdd([
      {
        id: "item-1",
        auditId,
        productId: "prod-1",
        countedQuantity: 10,
        countedAt: "2026-10-09T10:01:00.000Z",
        contadoPorId: "user-1",
        sync_status: "PENDING",
      },
      {
        id: "item-2-recounted-inflight",
        auditId,
        productId: "prod-2",
        countedQuantity: 5,
        countedAt: "2026-10-09T10:02:00.000Z",
        contadoPorId: "user-1",
        sync_status: "PENDING",
      },
    ]);

    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async () => {
      // Mientras el request HTTP está en vuelo:
      // a) El cajero captura un tercer producto (item-3-new-inflight)
      await db.dynamicAuditItems.add({
        id: "item-3-new-inflight",
        auditId,
        productId: "prod-3",
        countedQuantity: 8,
        countedAt: "2026-10-09T10:03:00.000Z",
        contadoPorId: "user-1",
        sync_status: "PENDING",
      });
      // b) El cajero corrige el conteo de item-2 con un nuevo timestamp
      await db.dynamicAuditItems.update("item-2-recounted-inflight", {
        countedQuantity: 9,
        countedAt: "2026-10-09T10:03:30.000Z",
        sync_status: "PENDING",
      });
      // c) El cajero finaliza la auditoría en vuelo
      await db.dynamicAudits.update(auditId, {
        status: "FINISHED",
        finishedAt: "2026-10-09T10:04:00.000Z",
        finalizadaPorId: "user-1",
        sync_status: "PENDING",
      });

      return {
        success: true,
        procesados: {
          turnos: [],
          ventas: [],
          auditorias: [],
          gastos: [],
          auditoriasDinamicas: [auditId],
        },
      };
    });

    const res = await pushToCloud();
    expect(res.success).toBe(true);
    expect(res.pushed?.auditoriasDinamicas).toBe(1);

    const item1 = await db.dynamicAuditItems.get("item-1");
    const item2 = await db.dynamicAuditItems.get("item-2-recounted-inflight");
    const item3 = await db.dynamicAuditItems.get("item-3-new-inflight");
    const header = await db.dynamicAudits.get(auditId);

    // item-1 no cambió durante el vuelo -> pasa a SYNCED
    expect(item1?.sync_status).toBe("SYNCED");
    // item-2 fue re-contado en vuelo -> se conserva PENDING para el siguiente push
    expect(item2?.sync_status).toBe("PENDING");
    // item-3 se creó en vuelo -> se conserva PENDING
    expect(item3?.sync_status).toBe("PENDING");
    // la cabecera se finalizó en vuelo -> se conserva PENDING para enviar finishedAt
    expect(header?.sync_status).toBe("PENDING");
  });

  it("3. Sin registros pendientes no realiza petición de red y devuelve conteos en 0", async () => {
    const spy = vi.spyOn(apiClientModule, "apiClient");
    const res = await pushToCloud();

    expect(res.success).toBe(true);
    expect(res.pushed).toEqual({
      turnos: 0,
      ventas: 0,
      auditorias: 0,
      gastos: 0,
      auditoriasDinamicas: 0,
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
