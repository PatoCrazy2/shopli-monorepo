import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export const AUDITS_PAGE_SIZE = 30;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayMexicoCity(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (year && month && day) {
    return `${year}-${month}-${day}`;
  }

  const now = new Date();
  const cdmxDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const y = cdmxDate.getUTCFullYear();
  const m = String(cdmxDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(cdmxDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseCdmxDateRange(dateStr?: string): { start: Date; end: Date; normalizedDate: string } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!DATE_REGEX.test(trimmed)) return null;

  const start = new Date(`${trimmed}T00:00:00.000-06:00`);
  const end = new Date(`${trimmed}T23:59:59.999-06:00`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }

  return { start, end, normalizedDate: trimmed };
}

export async function getAudits(filters: {
  sucursalId?: string;
  date?: string;
  page?: number;
}) {
  const session = await auth();
  if (!session?.user?.empresa_id) {
    throw new Error("No autorizado");
  }
  if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
    throw new Error("No tienes permisos para consultar auditorías");
  }

  const empresaId = session.user.empresa_id;
  const page = Math.max(1, filters.page && Number.isFinite(filters.page) ? Math.floor(filters.page) : 1);

  const sucursales = await db.sucursal.findMany({
    where: {
      empresa_id: empresaId,
      activo: true,
    },
    select: { id: true, nombre: true },
  });

  // Validar sucursalId contra las sucursales de la empresa sin hacer otra query
  const rawSucursalId = filters.sucursalId?.trim();
  if (rawSucursalId && !sucursales.some((s) => s.id === rawSucursalId)) {
    return {
      audits: [],
      total: 0,
      page,
      pageSize: AUDITS_PAGE_SIZE,
      sucursales,
      activeSucursalId: undefined,
      activeDate: undefined,
      invalidSucursal: true,
    };
  }

  const activeSucursalId = rawSucursalId || undefined;
  const todayStr = getTodayMexicoCity();
  const dateRange = parseCdmxDateRange(filters.date) ?? parseCdmxDateRange(todayStr)!;

  const where: any = {
    sucursal: {
      empresa_id: empresaId,
    },
  };

  if (activeSucursalId) {
    where.sucursalId = activeSucursalId;
  }

  where.startedAt = {
    gte: dateRange.start,
    lte: dateRange.end,
  };

  const [audits, total] = await Promise.all([
    db.dynamicAudit.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: AUDITS_PAGE_SIZE,
      skip: (page - 1) * AUDITS_PAGE_SIZE,
      select: {
        id: true,
        status: true,
        isApplied: true,
        startedAt: true,
        sucursal: {
          select: { nombre: true },
        },
        _count: {
          select: { items: true },
        },
        items: {
          where: {
            difference: { not: 0 },
          },
          select: { id: true },
          take: 1,
        },
      },
    }),
    db.dynamicAudit.count({ where }),
  ]);

  return {
    audits,
    total,
    page,
    pageSize: AUDITS_PAGE_SIZE,
    sucursales,
    activeSucursalId,
    activeDate: dateRange?.normalizedDate,
    invalidSucursal: false,
  };
}
