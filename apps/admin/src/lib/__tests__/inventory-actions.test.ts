import { describe, it, expect, vi, beforeEach } from "vitest";
import { adjustStock } from "../../app/dashboard/inventory/actions";
import {
  STOCK_IN_REASONS,
  STOCK_OUT_REASONS,
} from "../../app/dashboard/inventory/constants";
import { getProductKardex } from "../../app/dashboard/inventory/history/queries";
import { auth } from "@/lib/auth";
import { db } from "@shopli/db";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockTxUpdate = vi.fn();
const mockTxCreateMovimiento = vi.fn();

vi.mock("@shopli/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shopli/db")>();
  return {
    ...actual,
    db: {
      sucursal: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      producto: {
        findUnique: vi.fn(),
      },
      inventario_Sucursal: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      movimientoInventario: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback: any) => {
        return callback({
          inventario_Sucursal: {
            update: mockTxUpdate,
          },
          movimientoInventario: {
            create: mockTxCreateMovimiento,
          },
        });
      }),
    },
  };
});

describe("Fase 3: Estandarización de Motivos en Acciones de Inventario (adjustStock)", () => {
  const mockEmpresaId = "empresa-123";
  const mockUserId = "user-456";
  const mockSucursalId = "sucursal-789";
  const mockProductId = "prod-001";

  beforeEach(() => {
    vi.clearAllMocks();

    (auth as any).mockResolvedValue({
      user: {
        id: mockUserId,
        empresa_id: mockEmpresaId,
      },
    });

    (db.sucursal.findUnique as any).mockResolvedValue({
      id: mockSucursalId,
      empresa_id: mockEmpresaId,
    });

    (db.producto.findUnique as any).mockResolvedValue({
      id: mockProductId,
      empresa_id: mockEmpresaId,
    });

    (db.inventario_Sucursal.findUnique as any).mockResolvedValue({
      id: "inv-record-1",
      sucursal_id: mockSucursalId,
      producto_id: mockProductId,
      cantidad: 10,
    });
  });

  describe("1. Seguridad y Autenticación", () => {
    it("debe rechazar si la sesión no existe", async () => {
      (auth as any).mockResolvedValue(null);

      const res = await adjustStock({
        productId: mockProductId,
        amount: 5,
        operation: "IN",
        reason: "COMPRA",
        sucursalId: mockSucursalId,
      });

      expect(res.error).toMatch(/No autorizado/i);
    });

    it("debe rechazar si la sucursal pertenece a otra empresa (Multi-Tenant)", async () => {
      (db.sucursal.findUnique as any).mockResolvedValue({
        id: mockSucursalId,
        empresa_id: "otra-empresa-hacker",
      });

      const res = await adjustStock({
        productId: mockProductId,
        amount: 5,
        operation: "IN",
        reason: "COMPRA",
        sucursalId: mockSucursalId,
      });

      expect(res.error).toBe("No autorizado");
    });

    it("debe rechazar si el producto pertenece a otra empresa", async () => {
      (db.producto.findUnique as any).mockResolvedValue({
        id: mockProductId,
        empresa_id: "otra-empresa-hacker",
      });

      const res = await adjustStock({
        productId: mockProductId,
        amount: 5,
        operation: "IN",
        reason: "COMPRA",
        sucursalId: mockSucursalId,
      });

      expect(res.error).toBe("No autorizado");
    });
  });

  describe("2. Validación de Cantidades y Parámetros", () => {
    it("debe rechazar cantidades menores o iguales a cero", async () => {
      const resZero = await adjustStock({
        productId: mockProductId,
        amount: 0,
        operation: "IN",
        reason: "COMPRA",
        sucursalId: mockSucursalId,
      });
      expect(resZero.error).toMatch(/mayor a 0/i);

      const resNegative = await adjustStock({
        productId: mockProductId,
        amount: -10,
        operation: "IN",
        reason: "COMPRA",
        sucursalId: mockSucursalId,
      });
      expect(resNegative.error).toMatch(/mayor a 0/i);
    });
  });

  describe("3. Operaciones de Ingreso (IN) y Motivos Tipados", () => {
    it.each(STOCK_IN_REASONS)("debe aceptar el motivo válido de IN: %s", async (reason) => {
      const res = await adjustStock({
        productId: mockProductId,
        amount: 15,
        operation: "IN",
        reason,
        sucursalId: mockSucursalId,
        notes: "Entrada por proveedor",
      });

      expect(res.success).toBe(true);
      expect(mockTxUpdate).toHaveBeenCalledWith({
        where: { id: "inv-record-1" },
        data: expect.objectContaining({
          cantidad: { increment: 15 },
        }),
      });

      const expectedTipo = reason === "AJUSTE_POSITIVO" ? "AJUSTE" : "INGRESO";
      expect(mockTxCreateMovimiento).toHaveBeenCalledWith({
        data: expect.objectContaining({
          producto_id: mockProductId,
          sucursal_id: mockSucursalId,
          cantidad: 15,
          tipo: expectedTipo,
          motivo: `${reason} - Entrada por proveedor`,
          usuario_id: mockUserId,
        }),
      });
    });

    it("debe rechazar si se intenta usar un motivo de OUT con operación IN", async () => {
      const res = await adjustStock({
        productId: mockProductId,
        amount: 5,
        operation: "IN",
        reason: "MERMA" as any,
        sucursalId: mockSucursalId,
      });

      expect(res.error).toMatch(/Motivo inválido para ingreso/i);
    });
  });

  describe("4. Operaciones de Salida (OUT) y Motivos Tipados", () => {
    it.each(STOCK_OUT_REASONS)("debe aceptar el motivo válido de OUT: %s", async (reason) => {
      const res = await adjustStock({
        productId: mockProductId,
        amount: 3,
        operation: "OUT",
        reason,
        sucursalId: mockSucursalId,
      });

      expect(res.success).toBe(true);
      expect(mockTxUpdate).toHaveBeenCalledWith({
        where: { id: "inv-record-1" },
        data: expect.objectContaining({
          cantidad: { increment: -3 },
        }),
      });

      const expectedTipo = reason === "AJUSTE_NEGATIVO" ? "AJUSTE" : "EGRESO";
      expect(mockTxCreateMovimiento).toHaveBeenCalledWith({
        data: expect.objectContaining({
          producto_id: mockProductId,
          sucursal_id: mockSucursalId,
          cantidad: -3,
          tipo: expectedTipo,
          motivo: reason,
          usuario_id: mockUserId,
        }),
      });
    });

    it("debe rechazar si se intenta usar un motivo de IN con operación OUT", async () => {
      const res = await adjustStock({
        productId: mockProductId,
        amount: 5,
        operation: "OUT",
        reason: "COMPRA" as any,
        sucursalId: mockSucursalId,
      });

      expect(res.error).toMatch(/Motivo inválido para salida/i);
    });
  });

  describe("5. Compatibilidad Posicional", () => {
    it("debe funcionar correctamente cuando se llama con argumentos posicionales", async () => {
      const res = await adjustStock(
        mockProductId,
        10,
        "IN",
        "COMPRA",
        mockSucursalId,
        "Nota posicional"
      );

      expect(res.success).toBe(true);
      expect(mockTxUpdate).toHaveBeenCalledWith({
        where: { id: "inv-record-1" },
        data: expect.objectContaining({
          cantidad: { increment: 10 },
        }),
      });
      expect(mockTxCreateMovimiento).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cantidad: 10,
          tipo: "INGRESO",
          motivo: "COMPRA - Nota posicional",
        }),
      });
    });
  });

  describe("6. Consulta de Kárdex de Producto (getProductKardex)", () => {
    it("debe rechazar si la sesión no está activa", async () => {
      (auth as any).mockResolvedValue(null);
      await expect(getProductKardex(mockProductId)).rejects.toThrow("No autorizado");
    });

    it("debe rechazar si el producto pertenece a otra empresa", async () => {
      (db.producto.findUnique as any).mockResolvedValue({
        id: mockProductId,
        empresa_id: "otra-empresa",
      });
      await expect(getProductKardex(mockProductId)).rejects.toThrow("No autorizado");
    });

    it("debe obtener los movimientos con take: 20 y fecha serializada", async () => {
      (db.sucursal.findMany as any).mockResolvedValue([
        { id: mockSucursalId },
      ]);

      const mockDate = new Date("2026-10-02T12:00:00.000Z");
      (db.movimientoInventario.findMany as any).mockResolvedValue([
        {
          id: "mov-1",
          producto_id: mockProductId,
          sucursal_id: mockSucursalId,
          cantidad: 10,
          tipo: "INGRESO",
          motivo: "COMPRA",
          usuario_id: mockUserId,
          referencia_id: null,
          fecha: mockDate,
          sucursal: { nombre: "Sucursal Matriz" },
          usuario: { name: "Cajero Principal" },
        },
      ]);

      const kardex = await getProductKardex(mockProductId);

      expect(kardex).toHaveLength(1);
      expect(kardex[0].fecha).toBe(mockDate.toISOString());
      expect(kardex[0].cantidad).toBe(10);
      expect(kardex[0].tipo).toBe("INGRESO");
      expect(kardex[0].sucursal.nombre).toBe("Sucursal Matriz");
      expect(kardex[0].usuario.name).toBe("Cajero Principal");

      expect(db.movimientoInventario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            producto_id: mockProductId,
          }),
          take: 20,
          orderBy: { fecha: "desc" },
        })
      );
    });

    it("debe filtrar por sucursal específica si branchId es proporcionado", async () => {
      (db.sucursal.findMany as any).mockResolvedValue([
        { id: mockSucursalId },
        { id: "sucursal-otra" },
      ]);

      (db.movimientoInventario.findMany as any).mockResolvedValue([]);

      await getProductKardex(mockProductId, mockSucursalId);

      expect(db.movimientoInventario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            producto_id: mockProductId,
            sucursal_id: mockSucursalId,
          }),
        })
      );
    });
  });
});
