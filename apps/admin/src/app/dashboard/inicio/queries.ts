import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

function getTodayBounds() {
  const cdmxDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  }); // Retorna YYYY-MM-DD en la zona horaria de CDMX
  const start = new Date(`${cdmxDateStr}T00:00:00.000-06:00`);
  const end = new Date(`${cdmxDateStr}T23:59:59.999-06:00`);
  return { start, end, cdmxDateStr };
}

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  const { start, end, cdmxDateStr } = getTodayBounds();

  const sevenDaysAgo = new Date(`${cdmxDateStr}T00:00:00.000-06:00`);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // ─── Todas las queries independientes en paralelo ────────────────────────────
  // Antes: 6 viajes secuenciales a Neon (~800ms+ en frío)
  // Ahora: 5 viajes simultáneos — tiempo = el de la query más lenta (~200-350ms)
  const [
    totalSalesTodayAgg, // 1. Ventas totales del día + count de tickets (aggregate)
    detallesHoy,        // 2. Detalles con costo para calcular ganancia
    ventas7DiasQuery,   // 3. Ventas de los últimos 7 días para la gráfica
    branchesSalesQuery, // 4. Ventas agrupadas por sucursal (hoy)
    sucursales,         // 5. Todas las sucursales de la empresa (para nombres)
  ] = await Promise.all([
    // 1 — Aggregate: suma de ventas + count de tickets (elimina la query de count separada)
    db.venta.aggregate({
      _sum: { total: true },
      _count: { _all: true },
      where: {
        fecha: { gte: start, lte: end },
        estado: "COMPLETADA",
        sucursal: { empresa_id: empresaId },
      },
    }),

    // 2 — Detalles de venta con costo unitario para calcular ganancia bruta
    db.detalle_Venta.findMany({
      where: {
        venta: {
          fecha: { gte: start, lte: end },
          estado: "COMPLETADA",
          sucursal: { empresa_id: empresaId },
        },
      },
      include: {
        producto: { select: { costo: true } },
      },
    }),

    // 3 — Ventas de los últimos 7 días para la gráfica de barras
    db.venta.findMany({
      where: {
        fecha: { gte: sevenDaysAgo },
        estado: "COMPLETADA",
        sucursal: { empresa_id: empresaId },
      },
      select: { fecha: true, total: true },
    }),

    // 4 — Ventas agrupadas por sucursal (sólo hoy)
    db.venta.groupBy({
      by: ["sucursal_id"],
      _sum: { total: true },
      where: {
        fecha: { gte: start, lte: end },
        estado: "COMPLETADA",
        sucursal: { empresa_id: empresaId },
      },
    }),

    // 5 — Todas las sucursales de la empresa para resolver nombres
    // Corre en paralelo con las demás; elimina el segundo viaje secuencial a la DB
    db.sucursal.findMany({
      where: { empresa_id: empresaId },
      select: { id: true, nombre: true },
    }),
  ]);
  // ─────────────────────────────────────────────────────────────────────────────

  // Derivar valores de los resultados en paralelo
  const ventasHoy = Number(totalSalesTodayAgg._sum.total || 0);
  const ticketsTotales = totalSalesTodayAgg._count._all;

  const costosHoy = detallesHoy.reduce((acc, curr) => {
    return acc + curr.cantidad * Number(curr.producto.costo);
  }, 0);
  const gananciaHoy = ventasHoy - costosHoy;

  // Construir datos para la gráfica de los últimos 7 días
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

  // Construir ventas por sucursal resolviendo nombres desde la query paralela
  const sucursalMap = new Map(sucursales.map((s) => [s.id, s.nombre]));
  const branchSalesData = branchesSalesQuery
    .map((b) => ({
      id: b.sucursal_id,
      name: sucursalMap.get(b.sucursal_id) ?? "Desconocida",
      total: Number(b._sum.total || 0),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    ventasHoy,
    gananciaHoy,
    ticketsTotales,
    chartData,
    branchSalesData,
  };
}
