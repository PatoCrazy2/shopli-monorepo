import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { db, type LocalProduct } from "../../lib/db";
import {
  filterAuditableProducts,
  startDynamicAuditSession,
  recordAuditItemCount,
  finishDynamicAuditSession,
} from "../../features/inventory/hooks/useDynamicAudit";

const sampleProducts: LocalProduct[] = [
  {
    id: "prod-simple",
    nombre: "Coca Cola 600ml",
    codigo_interno: "CC600",
    descripcion: null,
    costo: 10,
    precio_publico: 18,
    precio_mayoreo: null,
    min_cantidad_mayoreo: null,
    categoria: "Bebidas",
    isCritical: false,
    isActive: true,
    parent_id: null,
    variante_nombre: null,
    updatedAt: "2026-10-09T10:00:00.000Z",
  },
  {
    id: "prod-parent",
    nombre: "Playera Básica",
    codigo_interno: "PB01",
    descripcion: null,
    costo: 50,
    precio_publico: 120,
    precio_mayoreo: null,
    min_cantidad_mayoreo: null,
    categoria: "Ropa",
    isCritical: false,
    isActive: true,
    parent_id: null,
    variante_nombre: null,
    updatedAt: "2026-10-09T10:00:00.000Z",
  },
  {
    id: "prod-variant-m",
    nombre: "Playera Básica - M",
    codigo_interno: "PB01-M",
    descripcion: null,
    costo: 50,
    precio_publico: 120,
    precio_mayoreo: null,
    min_cantidad_mayoreo: null,
    categoria: "Ropa",
    isCritical: false,
    isActive: true,
    parent_id: "prod-parent",
    variante_nombre: "M",
    updatedAt: "2026-10-09T10:00:00.000Z",
  },
];

describe("useDynamicAudit - Lógica de Dominio y Trazabilidad", () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.dynamicAudits.clear();
    await db.dynamicAuditItems.clear();
    await db.meta.clear();
    await db.products.bulkAdd(sampleProducts);
  });

  it("1. filterAuditableProducts excluye productos padre y conserva simples y variantes", () => {
    const auditable = filterAuditableProducts(sampleProducts);
    expect(auditable.map((p) => p.id)).toEqual(["prod-simple", "prod-variant-m"]);
  });

  it("2. startDynamicAuditSession guarda iniciadaPorId, status OPEN y bloquea active_audit_id", async () => {
    const { auditId, products } = await startDynamicAuditSession({
      branchId: "branch-1",
      userId: "user-encargado-1",
    });

    expect(auditId).toBeTruthy();
    expect(products).toHaveLength(2);

    const savedAudit = await db.dynamicAudits.get(auditId);
    expect(savedAudit).toMatchObject({
      id: auditId,
      branchId: "branch-1",
      status: "OPEN",
      finishedAt: null,
      iniciadaPorId: "user-encargado-1",
      finalizadaPorId: null,
      sync_status: "PENDING",
    });

    const activeMeta = await db.meta.get("active_audit_id");
    expect(activeMeta?.value).toBe(auditId);
  });

  it("3. recordAuditItemCount actualiza el ítem sin duplicarlo al re-contar y actualiza contadoPorId", async () => {
    const { auditId } = await startDynamicAuditSession({
      branchId: "branch-1",
      userId: "user-1",
    });

    // Primer conteo por user-1
    await recordAuditItemCount({
      auditId,
      productId: "prod-simple",
      countedQuantity: 12,
      userId: "user-1",
    });

    // Simulamos que ese ítem ya se sincronizó
    const itemsFirst = await db.dynamicAuditItems.where("auditId").equals(auditId).toArray();
    expect(itemsFirst).toHaveLength(1);
    await db.dynamicAuditItems.update(itemsFirst[0].id, { sync_status: "SYNCED" });

    // Segundo conteo (corrección) por user-2 tras cambio de sesión
    await recordAuditItemCount({
      auditId,
      productId: "prod-simple",
      countedQuantity: 15,
      userId: "user-2",
    });

    const itemsAfter = await db.dynamicAuditItems.where("auditId").equals(auditId).toArray();
    expect(itemsAfter).toHaveLength(1);
    expect(itemsAfter[0].countedQuantity).toBe(15);
    expect(itemsAfter[0].contadoPorId).toBe("user-2");
    expect(itemsAfter[0].sync_status).toBe("PENDING");
  });

  it("4. finishDynamicAuditSession marca FINISHED, guarda finishedAt y finalizadaPorId, limpia active_audit_id e invoca sync", async () => {
    const { auditId } = await startDynamicAuditSession({
      branchId: "branch-1",
      userId: "user-1",
    });

    // Simulamos que la cabecera inicial ya había pasado a SYNCED
    await db.dynamicAudits.update(auditId, { sync_status: "SYNCED" });

    const mockSync = vi.fn().mockResolvedValue({ success: true });

    await finishDynamicAuditSession({
      auditId,
      userId: "user-2",
      triggerSync: mockSync,
    });

    const finishedAudit = await db.dynamicAudits.get(auditId);
    expect(finishedAudit?.status).toBe("FINISHED");
    expect(finishedAudit?.finishedAt).toBeTruthy();
    expect(finishedAudit?.finalizadaPorId).toBe("user-2");
    expect(finishedAudit?.sync_status).toBe("PENDING");

    const activeMeta = await db.meta.get("active_audit_id");
    expect(activeMeta).toBeUndefined();
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it("5. finishDynamicAuditSession finaliza sin fallar cuando el dispositivo está offline y deja la cabecera en cola", async () => {
    const { auditId } = await startDynamicAuditSession({
      branchId: "branch-1",
      userId: "user-1",
    });

    const failingSync = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    await expect(
      finishDynamicAuditSession({
        auditId,
        userId: "user-1",
        triggerSync: failingSync,
      })
    ).resolves.toBeUndefined();

    const finishedAudit = await db.dynamicAudits.get(auditId);
    expect(finishedAudit?.status).toBe("FINISHED");
    expect(finishedAudit?.sync_status).toBe("PENDING");
    expect(await db.meta.get("active_audit_id")).toBeUndefined();
  });
});
