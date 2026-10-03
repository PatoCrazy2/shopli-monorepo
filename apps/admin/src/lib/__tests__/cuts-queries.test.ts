import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCuts } from "../../app/dashboard/cuts/queries";
import { auth } from "@/lib/auth";
import { db } from "@shopli/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@shopli/db", () => ({
  db: {
    turno: {
      findMany: vi.fn(),
    },
  },
}));

describe("Fase 16 - Etapa 1: Blindaje en getCuts ante fechas inválidas y optimización", () => {
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

  it("retorna arreglo vacío si la fecha es inválida sin consultar la base de datos", async () => {
    const result = await getCuts("sucursal-1", "fecha-invalida");

    expect(result).toEqual([]);
    expect(db.turno.findMany).not.toHaveBeenCalled();
  });

  it("retorna arreglo vacío si la fecha tiene formato incorrecto o corrupto", async () => {
    const result = await getCuts("sucursal-1", "2026-99-99");

    expect(result).toEqual([]);
    expect(db.turno.findMany).not.toHaveBeenCalled();
  });

  it("consulta Prisma con offset CDMX cuando la fecha es válida", async () => {
    (db.turno.findMany as any).mockResolvedValue([]);

    const result = await getCuts("sucursal-1", "2026-10-02");

    expect(result).toEqual([]);
    expect(db.turno.findMany).toHaveBeenCalledTimes(1);

    const callArgs = (db.turno.findMany as any).mock.calls[0][0];
    expect(callArgs.where.fecha_apertura.gte).toBeInstanceOf(Date);
    expect(isNaN(callArgs.where.fecha_apertura.gte.getTime())).toBe(false);
  });
});
