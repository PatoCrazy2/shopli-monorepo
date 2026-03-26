import { db, Prisma } from "@shopli/db";
import { AnalyticsFilters, AnalyticsData } from "./types";

export async function getAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
  const where: Prisma.VentaWhereInput = {
    estado: filters.estado ?? "COMPLETADA",
  };

  if (filters.startDate) {
    where.fecha = { 
        ...((typeof where.fecha === 'object' ? where.fecha : {}) as Prisma.DateTimeFilter), 
        gte: new Date(filters.startDate) 
    };
  }
  if (filters.endDate) {
    where.fecha = { 
        ...((typeof where.fecha === 'object' ? where.fecha : {}) as Prisma.DateTimeFilter), 
        lte: new Date(filters.endDate) 
    };
  }
  if (filters.sucursalId) {
    where.sucursal_id = filters.sucursalId;
  }
  if (filters.usuarioId) {
    where.turno = { usuario_id: filters.usuarioId };
  }

  // 1. Obtencion de ventas con detalles necesarios (evita N+1 y obtiene lo justo)
  const sales = await db.venta.findMany({
    where,
    select: {
      id: true,
      total: true,
      fecha: true,
      sucursal_id: true,
      turno: { select: { usuario_id: true } },
      detalles: {
        select: {
          producto_id: true,
          cantidad: true,
          precio_unitario_historico: true,
          producto: {
            select: { costo: true, nombre: true, categoria: true }
          }
        }
      }
    }
  });

  // Agregaciones en logica backend
  let totalRevenue = 0;
  let totalTransactions = sales.length;
  let totalCosts = 0;
  
  const branchMap = new Map<string, { total: number; count: number }>();
  const userMap = new Map<string, { total: number; count: number }>();
  const dateMap = new Map<string, number>();
  const productMap = new Map<string, {
    name: string;
    category: string | null;
    units: number;
    revenue: number;
    costs: number;
  }>();

  for (const s of sales) {
    const saleTotal = Number(s.total) || 0;
    totalRevenue += saleTotal;

    // Branches
    if (!branchMap.has(s.sucursal_id)) {
      branchMap.set(s.sucursal_id, { total: 0, count: 0 });
    }
    const b = branchMap.get(s.sucursal_id)!;
    b.total += saleTotal;
    b.count += 1;

    // Users
    const userId = s.turno.usuario_id;
    if (!userMap.has(userId)) {
      userMap.set(userId, { total: 0, count: 0 });
    }
    const u = userMap.get(userId)!;
    u.total += saleTotal;
    u.count += 1;

    // Dates (por dia)
    const dateStr = s.fecha.toISOString().split("T")[0]; // YYYY-MM-DD
    dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + saleTotal);

    // Products / Costs / Margins
    for (const d of s.detalles) {
      const pCost = Number(d.producto.costo) || 0;
      const pRevenue = Number(d.precio_unitario_historico) * d.cantidad;
      const pCostTotal = pCost * d.cantidad;
      
      totalCosts += pCostTotal;

      if (!productMap.has(d.producto_id)) {
        productMap.set(d.producto_id, {
          name: d.producto.nombre,
          category: d.producto.categoria,
          units: 0,
          revenue: 0,
          costs: 0
        });
      }
      const p = productMap.get(d.producto_id)!;
      p.units += d.cantidad;
      p.revenue += pRevenue;
      p.costs += pCostTotal;
    }
  }

  // Optimización: resolver nombres de sucursales y usuarios usados en esta consulta
  const branchIds = Array.from(branchMap.keys());
  const userIds = Array.from(userMap.keys());
  
  const [branches, users] = await Promise.all([
     branchIds.length > 0 ? db.sucursal.findMany({ where: { id: { in: branchIds } } }) : [],
     userIds.length > 0 ? db.user.findMany({ where: { id: { in: userIds } } }) : []
  ]);
  
  const branchNameMap = new Map(branches.map(b => [b.id, b.nombre]));
  const userNameMap = new Map(users.map(u => [u.id, u.name || u.email]));

  const branchSales = branchIds.map(id => ({
     branchId: id,
     branchName: branchNameMap.get(id) || "Desconocida",
     totalSales: branchMap.get(id)!.total,
     transactionCount: branchMap.get(id)!.count
  })).sort((a,b) => b.totalSales - a.totalSales);

  const userSales = userIds.map(id => ({
     userId: id,
     userName: userNameMap.get(id) || "Usuario Desconocido",
     totalSales: userMap.get(id)!.total,
     transactionCount: userMap.get(id)!.count
  })).sort((a,b) => b.totalSales - a.totalSales);

  const dateSales = Array.from(dateMap.entries()).map(([date, total]) => ({
      date,
      totalSales: total
  })).sort((a,b) => a.date.localeCompare(b.date));

  const topProducts = Array.from(productMap.entries()).map(([id, p]) => ({
      productId: id,
      productName: p.name,
      category: p.category,
      unitsSold: p.units,
      revenue: p.revenue,
      grossMargin: p.revenue - p.costs
  })).sort((a,b) => b.revenue - a.revenue).slice(0, 15);

  const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const grossProfit = totalRevenue - totalCosts;

  return {
    summary: {
       totalRevenue,
       totalTransactions,
       averageTicket,
       totalCosts,
       grossProfit
    },
    branchSales,
    userSales,
    dateSales,
    topProducts
  };
}

export async function getFilterOptions() {
   const [sucursales, usuarios] = await Promise.all([
      db.sucursal.findMany({ select: { id: true, nombre: true } }),
      db.user.findMany({ select: { id: true, name: true, email: true } })
   ]);

   return { sucursales, usuarios };
}
