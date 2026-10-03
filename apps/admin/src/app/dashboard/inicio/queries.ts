import { db } from "@shopli/db";
import { getSession } from "@/lib/get-session";

function getTodayBounds() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  const cdmxDateStr =
    year && month && day
      ? `${year}-${month}-${day}`
      : (() => {
          const now = new Date();
          const cdmx = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          return `${cdmx.getUTCFullYear()}-${String(cdmx.getUTCMonth() + 1).padStart(2, "0")}-${String(cdmx.getUTCDate()).padStart(2, "0")}`;
        })();

  const start = new Date(`${cdmxDateStr}T00:00:00.000-06:00`);
  const end = new Date(`${cdmxDateStr}T23:59:59.999-06:00`);
  return { start, end, cdmxDateStr };
}

/**
 * Query rápida: suma de ventas, ganancia y total de tickets del día.
 * 2 queries agregadas en paralelo ejecutadas directamente en Postgres.
 */
export async function getKPIData() {
  const session = await getSession();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;
  const { start, end } = getTodayBounds();

  const [agg, costosQuery] = await Promise.all([
    // Aggregate: total de ventas + count de tickets en una sola query
    db.venta.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: {
        fecha: { gte: start, lte: end },
        estado: "COMPLETADA",
        sucursal: { empresa_id: empresaId },
      },
    }),

    // Total de costos (COGS) calculado nativamente en Postgres (sin traer miles de filas a memoria)
    db.$queryRaw<{ totalCosts: number | null }[]>`
      SELECT 
        COALESCE(SUM(d.cantidad * p.costo), 0)::float as "totalCosts"
      FROM "Detalle_Venta" d
      JOIN "Producto" p ON d.producto_id = p.id
      JOIN "Venta" v ON d.venta_id = v.id
      JOIN "Sucursal" s ON v.sucursal_id = s.id
      WHERE v.fecha >= ${start}
        AND v.fecha <= ${end}
        AND v.estado = 'COMPLETADA'::"EstadoVenta"
        AND s.empresa_id = ${empresaId}
    `,
  ]);

  const ventasHoy = Number(agg._sum.total || 0);
  const ticketsTotales = agg._count._all;
  const costosHoy = Number(costosQuery[0]?.totalCosts || 0);
  const gananciaHoy = ventasHoy - costosHoy;

  return { ventasHoy, gananciaHoy, ticketsTotales };
}

/**
 * Query más pesada: ventas de los últimos 7 días + ventas por sucursal.
 * 3 queries en paralelo. Segunda en renderizar (Suspense stream).
 */
export async function getChartsData() {
  const session = await getSession();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;
  const { start, end, cdmxDateStr } = getTodayBounds();

  const sevenDaysAgo = new Date(`${cdmxDateStr}T00:00:00.000-06:00`);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [ventas7DiasQuery, branchesSalesQuery, sucursales] = await Promise.all([
    // Ventas de los últimos 7 días para la gráfica de barras
    db.venta.findMany({
      where: {
        fecha: { gte: sevenDaysAgo },
        estado: "COMPLETADA",
        sucursal: { empresa_id: empresaId },
      },
      select: { fecha: true, total: true },
    }),

    // Ventas agrupadas por sucursal (hoy)
    db.venta.groupBy({
      by: ["sucursal_id"],
      _sum: { total: true },
      where: {
        fecha: { gte: start, lte: end },
        estado: "COMPLETADA",
        sucursal: { empresa_id: empresaId },
      },
    }),

    // Todas las sucursales de la empresa para resolver nombres
    db.sucursal.findMany({
      where: { empresa_id: empresaId },
      select: { id: true, nombre: true },
    }),
  ]);

  // Construir datos para la gráfica semanal
  const chartDataMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(`${cdmxDateStr}T12:00:00.000-06:00`);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      timeZone: "America/Mexico_City",
    });
    chartDataMap.set(label, 0);
  }
  ventas7DiasQuery.forEach((v) => {
    const label = v.fecha.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      timeZone: "America/Mexico_City",
    });
    if (chartDataMap.has(label)) {
      chartDataMap.set(label, chartDataMap.get(label)! + Number(v.total));
    }
  });
  const chartData = Array.from(chartDataMap.entries()).map(([date, total]) => ({
    date,
    total,
  }));

  // Construir ventas por sucursal
  const sucursalMap = new Map(sucursales.map((s) => [s.id, s.nombre]));
  const branchSalesData = branchesSalesQuery
    .map((b) => ({
      id: b.sucursal_id,
      name: sucursalMap.get(b.sucursal_id) ?? "Desconocida",
      total: Number(b._sum.total || 0),
    }))
    .sort((a, b) => b.total - a.total);

  return { chartData, branchSalesData };
}
