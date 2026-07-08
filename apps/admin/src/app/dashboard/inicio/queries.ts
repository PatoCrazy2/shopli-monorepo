import { db } from "@shopli/db";
import { auth } from "@/lib/auth";

function getTodayBounds() {
  const cdmxDateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  }); // Retorna YYYY-MM-DD en la zona horaria de CDMX
  const start = new Date(`${cdmxDateStr}T00:00:00.000-06:00`);
  const end = new Date(`${cdmxDateStr}T23:59:59.999-06:00`);
  return { start, end };
}

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  const empresaId = session.user.empresa_id;

  const { start, end } = getTodayBounds();

  // 1. Ventas totales del día
  const totalSalesTodayAgg = await db.venta.aggregate({
    _sum: {
      total: true,
    },
    where: {
      fecha: {
        gte: start,
        lte: end,
      },
      estado: "COMPLETADA",
      sucursal: {
        empresa_id: empresaId
      }
    },
  });
  const ventasHoy = Number(totalSalesTodayAgg._sum.total || 0);

  // 2. Ganancia del día (ingresos - costos)
  const detallesHoy = await db.detalle_Venta.findMany({
    where: {
      venta: {
        fecha: { gte: start, lte: end },
        estado: "COMPLETADA",
        sucursal: {
          empresa_id: empresaId
        }
      },
    },
    include: {
      producto: { select: { costo: true } },
    },
  });

  const costosHoy = detallesHoy.reduce((acc, curr) => {
    return acc + (curr.cantidad * Number(curr.producto.costo));
  }, 0);

  const gananciaHoy = ventasHoy - costosHoy;

  // 3. Tickets totales (Ventas count)
  const ticketsTotales = await db.venta.count({
    where: {
      fecha: {
        gte: start,
        lte: end,
      },
      estado: "COMPLETADA",
      sucursal: {
        empresa_id: empresaId
      }
    },
  });

  // 4. Ventas agrupadas de los últimos 7 días
  const todayCdmxStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
  const sevenDaysAgo = new Date(`${todayCdmxStr}T00:00:00.000-06:00`);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const ventas7DiasQuery = await db.venta.findMany({
    where: {
      fecha: {
        gte: sevenDaysAgo,
      },
      estado: "COMPLETADA",
      sucursal: {
        empresa_id: empresaId
      }
    },
    select: {
      fecha: true,
      total: true,
    },
  });

  const chartDataMap = new Map<string, number>();
  for(let i=6; i>=0; i--) {
     const d = new Date(`${todayCdmxStr}T12:00:00.000-06:00`);
     d.setDate(d.getDate() - i);
     // format: vie 19
     const label = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", timeZone: "America/Mexico_City" });
     chartDataMap.set(label, 0);
  }

  ventas7DiasQuery.forEach(v => {
     const label = v.fecha.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", timeZone: "America/Mexico_City" });
     if (chartDataMap.has(label)) {
        chartDataMap.set(label, chartDataMap.get(label)! + Number(v.total));
     }
  });

  const chartData = Array.from(chartDataMap.entries()).map(([date, total]) => ({
    date,
    total,
  }));

  // 5. Ventas por sucursal / caja del día
  const branchesSalesQuery = await db.venta.groupBy({
    by: ['sucursal_id'],
    _sum: {
      total: true,
    },
    where: {
      fecha: {
        gte: start,
        lte: end,
      },
      estado: "COMPLETADA",
      sucursal: {
        empresa_id: empresaId
      }
    },
  });

  const sucursales = await db.sucursal.findMany({
     where: { 
       id: { in: branchesSalesQuery.map(b => b.sucursal_id) },
       empresa_id: empresaId
     }
  });

  const branchSalesData = branchesSalesQuery.map(b => {
      const sucursal = sucursales.find(s => s.id === b.sucursal_id);
      return {
          id: b.sucursal_id,
          name: sucursal?.nombre || "Desconocida",
          total: Number(b._sum.total || 0),
      };
  }).sort((a,b) => b.total - a.total);

  return {
    ventasHoy,
    gananciaHoy,
    ticketsTotales,
    chartData,
    branchSalesData,
  };
}
