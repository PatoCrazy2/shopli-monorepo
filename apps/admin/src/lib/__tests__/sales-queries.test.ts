import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSales } from "../../app/dashboard/sales/queries";
import { auth } from "@/lib/auth";
import { db } from "@shopli/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@shopli/db", () => ({
  db: {
    venta: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Fase 15 - Etapa 1: Blindaje en getSales ante fechas inválidas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: {
        id: "user-1",
        role: "DUENO",
        empresa_id: "empresa-1",
      },
    });
  });

  it("retorna resultado vacío si dateStr es inválido sin consultar la base de datos", async () => {
    const result = await getSales({
      sucursalId: "sucursal-1",
      dateStr: "fecha-invalida",
    });

    expect(result).toEqual({
      ventas: [],
      total: 0,
      page: 1,
      pageSize: 50,
    });
    expect(db.venta.findMany).not.toHaveBeenCalled();
    expect(db.venta.count).not.toHaveBeenCalled();
  });

  it("retorna resultado vacío si dateStr tiene caracteres corruptos", async () => {
    const result = await getSales({
      sucursalId: "sucursal-1",
      dateStr: "2026-99-99", // Invalid date
    });

    expect(result).toEqual({
      ventas: [],
      total: 0,
      page: 1,
      pageSize: 50,
    });
    expect(db.venta.findMany).not.toHaveBeenCalled();
    expect(db.venta.count).not.toHaveBeenCalled();
  });

  it("consulta Prisma correctamente cuando la fecha es válida", async () => {
    (db.venta.findMany as any).mockResolvedValue([]);
    (db.venta.count as any).mockResolvedValue(0);

    const result = await getSales({
      sucursalId: "sucursal-1",
      dateStr: "2026-10-02",
    });

    expect(result.ventas).toEqual([]);
    expect(db.venta.findMany).toHaveBeenCalledTimes(1);
    expect(db.venta.count).toHaveBeenCalledTimes(1);

    const callArgs = (db.venta.findMany as any).mock.calls[0][0];
    expect(callArgs.where.fecha.gte).toBeInstanceOf(Date);
    expect(isNaN(callArgs.where.fecha.gte.getTime())).toBe(false);
  });
});
