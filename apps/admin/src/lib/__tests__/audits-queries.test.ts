import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAudits, parseCdmxDateRange, AUDITS_PAGE_SIZE } from "@/app/dashboard/audits/queries";
import { auth } from "@/lib/auth";
import { db } from "@shopli/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@shopli/db", () => ({
  db: {
    sucursal: {
      findMany: vi.fn(),
    },
    dynamicAudit: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Audits Queries - Seguridad, Paginación y Filtrado", () => {
  const mockEmpresaId = "empresa-tenant-1";
  const mockSucursales = [
    { id: "sucursal-1", nombre: "Sucursal Centro" },
    { id: "sucursal-2", nombre: "Sucursal Norte" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: {
        id: "user-1",
        role: "DUENO",
        empresa_id: mockEmpresaId,
      },
    });

    (db.sucursal.findMany as any).mockResolvedValue(mockSucursales);
    (db.dynamicAudit.findMany as any).mockResolvedValue([]);
    (db.dynamicAudit.count as any).mockResolvedValue(0);
  });

  it("1. parseCdmxDateRange valida formato YYYY-MM-DD y genera offset CDMX correcto", () => {
    expect(parseCdmxDateRange(undefined)).toBeNull();
    expect(parseCdmxDateRange("")).toBeNull();
    expect(parseCdmxDateRange("2026/10/09")).toBeNull();
    expect(parseCdmxDateRange("fecha-invalida")).toBeNull();

    const range = parseCdmxDateRange("2026-10-09");
    expect(range).not.toBeNull();
    expect(range?.normalizedDate).toBe("2026-10-09");
    expect(range?.start.toISOString()).toBe(new Date("2026-10-09T00:00:00.000-06:00").toISOString());
    expect(range?.end.toISOString()).toBe(new Date("2026-10-09T23:59:59.999-06:00").toISOString());
  });

  it("2. Ignora fecha inválida y consulta sin filtro de fecha sin romper", async () => {
    await getAudits({
      date: "invalid-date",
    });

    expect(db.dynamicAudit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sucursal: { empresa_id: mockEmpresaId },
        },
      })
    );
  });

  it("3. Aplica rango de fecha en startedAt cuando date es válido", async () => {
    await getAudits({
      date: "2026-10-09",
    });

    const expectedRange = parseCdmxDateRange("2026-10-09");
    expect(db.dynamicAudit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sucursal: { empresa_id: mockEmpresaId },
          startedAt: {
            gte: expectedRange?.start,
            lte: expectedRange?.end,
          },
        },
      })
    );
  });

  it("4. Protege contra sucursal de otra empresa marcando invalidSucursal y sin consultar auditorías", async () => {
    const result = await getAudits({
      sucursalId: "sucursal-de-otro-tenant",
    });

    expect(result.invalidSucursal).toBe(true);
    expect(result.audits).toEqual([]);
    expect(result.total).toBe(0);
    expect(db.dynamicAudit.findMany).not.toHaveBeenCalled();
    expect(db.dynamicAudit.count).not.toHaveBeenCalled();
  });

  it("5. Maneja paginación calculando skip y take acordes", async () => {
    await getAudits({
      page: 3,
    });

    expect(db.dynamicAudit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: AUDITS_PAGE_SIZE,
        skip: 2 * AUDITS_PAGE_SIZE,
      })
    );
  });

  it("6. Aplica select estricto con take: 1 en items con discrepancias", async () => {
    await getAudits({});

    expect(db.dynamicAudit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          status: true,
          isApplied: true,
          startedAt: true,
          sucursal: { select: { nombre: true } },
          _count: { select: { items: true } },
          items: {
            where: { difference: { not: 0 } },
            select: { id: true },
            take: 1,
          },
        }),
      })
    );
  });

  it("7. Rechaza usuarios no autenticados o con roles sin permiso", async () => {
    (auth as any).mockResolvedValueOnce(null);
    await expect(getAudits({})).rejects.toThrow("No autorizado");

    (auth as any).mockResolvedValueOnce({
      user: { id: "user-cajero", role: "CAJERO", empresa_id: "empresa-1" },
    });
    await expect(getAudits({})).rejects.toThrow("No tienes permisos para consultar auditorías");
  });
});
