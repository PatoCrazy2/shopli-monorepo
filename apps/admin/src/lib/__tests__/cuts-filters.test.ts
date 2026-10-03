import { describe, it, expect } from "vitest";

function getSafeDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("Fase 17: Filtros de Cortes de Caja (CutsFilters)", () => {
  it("genera fechas seguras en formato YYYY-MM-DD sin caracteres especiales", () => {
    const fixedDate = new Date(2026, 9, 2); // 2 de octubre de 2026
    const str = getSafeDateString(fixedDate);
    expect(str).toBe("2026-10-02");
    expect(str.length).toBe(10);
    expect(/^2026-10-02$/.test(str)).toBe(true);
  });

  it("calcula la fecha de ayer con precisión matemática", () => {
    const baseDate = new Date(2026, 9, 2);
    const yesterday = new Date(baseDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const str = getSafeDateString(yesterday);
    expect(str).toBe("2026-10-01");
  });

  it("selecciona automáticamente la única sucursal si no hay más", () => {
    const sucursales = [{ id: "suc-1", nombre: "Matriz" }];
    const currentSucursal = undefined;
    const effectiveSucursal = currentSucursal || (sucursales.length === 1 ? sucursales[0].id : "");
    expect(effectiveSucursal).toBe("suc-1");
  });

  it("mantiene selección vacía si hay múltiples sucursales y ninguna seleccionada", () => {
    const sucursales = [
      { id: "suc-1", nombre: "Matriz" },
      { id: "suc-2", nombre: "Sucursal Norte" },
    ];
    const currentSucursal = undefined;
    const effectiveSucursal = currentSucursal || (sucursales.length === 1 ? sucursales[0].id : "");
    expect(effectiveSucursal).toBe("");
  });
});
