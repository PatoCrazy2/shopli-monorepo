import { describe, it, expect, vi } from "vitest";
import { getTodayMexicoCity, resolveAnalyticsDateRange } from "@/app/dashboard/analytics/queries";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@shopli/db", () => ({
  db: {},
  Prisma: {
    sql: vi.fn(),
    join: vi.fn(),
  },
}));

describe("Analytics Date Range & Default Today Optimization", () => {
  it("1. Usa Hoy (CDMX) por defecto cuando no se envían startDate ni endDate", () => {
    const todayStr = getTodayMexicoCity();
    const { sDate, eDate } = resolveAnalyticsDateRange(undefined, undefined);

    expect(sDate.toISOString()).toBe(new Date(`${todayStr}T00:00:00.000-06:00`).toISOString());
    expect(eDate.toISOString()).toBe(new Date(`${todayStr}T23:59:59.999-06:00`).toISOString());
  });

  it("2. Usa Hoy (CDMX) por defecto cuando las fechas tienen formato inválido", () => {
    const todayStr = getTodayMexicoCity();
    const { sDate, eDate } = resolveAnalyticsDateRange("invalid-start", "2026/10/09");

    expect(sDate.toISOString()).toBe(new Date(`${todayStr}T00:00:00.000-06:00`).toISOString());
    expect(eDate.toISOString()).toBe(new Date(`${todayStr}T23:59:59.999-06:00`).toISOString());
  });

  it("3. Aplica correctamente un rango personalizado de fecha inicio y fin en zona horaria CDMX", () => {
    const { sDate, eDate } = resolveAnalyticsDateRange("2026-10-01", "2026-10-09");

    expect(sDate.toISOString()).toBe(new Date("2026-10-01T00:00:00.000-06:00").toISOString());
    expect(eDate.toISOString()).toBe(new Date("2026-10-09T23:59:59.999-06:00").toISOString());
  });

  it("4. Invierte automáticamente startDate y endDate si inicio > fin conservando límites de día completos", () => {
    const { sDate, eDate } = resolveAnalyticsDateRange("2026-10-09", "2026-10-01");

    expect(sDate.toISOString()).toBe(new Date("2026-10-01T00:00:00.000-06:00").toISOString());
    expect(eDate.toISOString()).toBe(new Date("2026-10-09T23:59:59.999-06:00").toISOString());
  });

  it("5. Limita rangos mayores a 366 días para proteger la base de datos", () => {
    const { sDate, eDate } = resolveAnalyticsDateRange("2020-01-01", "2026-10-09");
    const maxMs = 366 * 24 * 60 * 60 * 1000;

    expect(eDate.toISOString()).toBe(new Date("2026-10-09T23:59:59.999-06:00").toISOString());
    expect(eDate.getTime() - sDate.getTime()).toBe(maxMs);
  });
});
