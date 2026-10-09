import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { ShopLIPOSDatabase } from "../../lib/db";

describe("Dexie Migration v13 -> v14 (Auditoría Dinámica)", () => {
  it("migra una base v13 con auditoría activa a v14 sin perder ítems y asigna status: 'OPEN'", async () => {
    const dbName = `ShopLIPOS_MigrationTest_${crypto.randomUUID()}`;

    // 1. Crear e inicializar base en versión 13 (esquema legado)
    const legacyDb = new Dexie(dbName);
    legacyDb.version(13).stores({
      users: "id, role, pin",
      branches: "id",
      products: "id, codigo_interno, categoria",
      turnos: "id, usuario_id, sucursal_id, estado, sync_status",
      cart: "id, producto_id",
      sales: "id, turno_id, estado, sync_status, fecha",
      sale_details: "id, venta_id, producto_id",
      inventory: "id, sucursal_id, producto_id, [sucursal_id+producto_id]",
      audits: "id, shiftId, sync_status",
      gastos: "id, turno_id, sucursal_id, sync_status",
      dynamicAuditItems: "id, auditId, productId, [auditId+productId], sync_status",
      dynamicAudits: "id, branchId, sync_status",
      meta: "key",
    });

    await legacyDb.open();

    const auditId = crypto.randomUUID();
    const itemId = crypto.randomUUID();
    const productId = crypto.randomUUID();

    await legacyDb.table("dynamicAudits").add({
      id: auditId,
      branchId: "branch-1",
      startedAt: "2026-10-09T10:00:00.000Z",
      sync_status: "SYNCED",
    });

    await legacyDb.table("dynamicAuditItems").add({
      id: itemId,
      auditId,
      productId,
      countedQuantity: 15,
      countedAt: "2026-10-09T10:05:00.000Z",
      sync_status: "PENDING",
    });

    legacyDb.close();

    // 2. Abrir con ShopLIPOSDatabase (v14)
    const upgradedDb = new ShopLIPOSDatabase(dbName);
    await upgradedDb.open();

    const migratedAudit = await upgradedDb.dynamicAudits.get(auditId);
    expect(migratedAudit).toBeDefined();
    expect(migratedAudit?.status).toBe("OPEN");
    expect(migratedAudit?.finishedAt).toBeNull();
    expect(migratedAudit?.iniciadaPorId).toBeNull();
    expect(migratedAudit?.finalizadaPorId).toBeNull();

    // Verificar que el índice por status funciona
    const openAudits = await upgradedDb.dynamicAudits.where("status").equals("OPEN").toArray();
    expect(openAudits).toHaveLength(1);
    expect(openAudits[0].id).toBe(auditId);

    // Verificar que los ítems existentes se conservan intactos
    const items = await upgradedDb.dynamicAuditItems.where("auditId").equals(auditId).toArray();
    expect(items).toHaveLength(1);
    expect(items[0].countedQuantity).toBe(15);
    expect(items[0].sync_status).toBe("PENDING");

    upgradedDb.close();
    await Dexie.delete(dbName);
  });
});
