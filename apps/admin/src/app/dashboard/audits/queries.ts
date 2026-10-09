import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

export const AUDITS_PAGE_SIZE = 30;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
  const dateRange = parseCdmxDateRange(filters.date);

  const where: any = {
    sucursal: {
      empresa_id: empresaId,
    },
  };

  if (activeSucursalId) {
    where.sucursalId = activeSucursalId;
  }

  if (dateRange) {
    where.startedAt = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

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
