import { db } from "@shopli/db";
import type { Prisma, GastoCategoria } from "@shopli/db";
import { AnalyticsFilters, AnalyticsData, InventoryAnalytics, CategoryPerformance } from "./types";

export async function getAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
  try {
    const where: Prisma.VentaWhereInput = {};

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.startDate && filters.endDate) {
      const s = new Date(`${filters.startDate}T00:00:00.000-06:00`);
      const e = new Date(`${filters.endDate}T23:59:59.999-06:00`);
      where.fecha = { gte: s, lte: e };
    } else if (filters.startDate) {
      where.fecha = { gte: new Date(`${filters.startDate}T00:00:00.000-06:00`) };
    } else if (filters.endDate) {
      where.fecha = { lte: new Date(`${filters.endDate}T23:59:59.999-06:00`) };
    }
    
    if (filters.sucursalId) {
      where.sucursal_id = filters.sucursalId;
    }
    if (filters.usuarioId) {
      where.turno = { usuario_id: filters.usuarioId };
    }

    // 1. Obtencion de ventas con detalles
    const sales = await db.venta.findMany({
      where,
      include: {
        turno: { select: { usuario_id: true } },
        detalles: {
          include: {
            producto: {
              select: { costo: true, nombre: true, categoria: true }
            }
          }
        }
      },
      orderBy: { fecha: 'asc' }
    });

    // 2. Obtención de gastos en el periodo
    const gastosWhere: Prisma.GastoWhereInput = {};
    if (filters.startDate && filters.endDate) {
      const s = new Date(`${filters.startDate}T00:00:00.000-06:00`);
      const e = new Date(`${filters.endDate}T23:59:59.999-06:00`);
      gastosWhere.fecha = { gte: s, lte: e };
    }
    if (filters.sucursalId) {
      gastosWhere.sucursal_id = filters.sucursalId;
    }

    const gastos = await db.gasto.findMany({ where: gastosWhere });

    // Agregaciones
    let totalRevenue = 0;
    let totalTransactions = sales.length;
    let totalCosts = 0;
    let totalExpenses = 0;
    
    const branchMap = new Map<string, { total: number; count: number }>();
    const userMap = new Map<string, { total: number; count: number }>();
    const dateMap = new Map<string, { rev: number; count: number }>();
    const categoryMap = new Map<string, number>();
    const expenseCategoryMap = new Map<string, number>();
    const productMap = new Map<string, {
      name: string;
      category: string | null;
      units: number;
      revenue: number;
      costs: number;
    }>();

    const monthlyBalanceMap = new Map<string, { 
      revenue: number; 
      fixed: number; 
      variable: number 
    }>();

    for (const s of sales) {
      const saleTotal = Number(s.total) || 0;
      totalRevenue += saleTotal;

      const monthKey = new Intl.DateTimeFormat('es-MX', { 
        timeZone: 'America/Mexico_City', 
        year: 'numeric', 
        month: 'long' 
      }).format(s.fecha);
      
      if (!monthlyBalanceMap.has(monthKey)) {
          monthlyBalanceMap.set(monthKey, { revenue: 0, fixed: 0, variable: 0 });
      }
      monthlyBalanceMap.get(monthKey)!.revenue += saleTotal;

      if (!branchMap.has(s.sucursal_id)) {
        branchMap.set(s.sucursal_id, { total: 0, count: 0 });
      }
      const b = branchMap.get(s.sucursal_id)!;
      b.total += saleTotal;
      b.count += 1;

      const userId = s.turno.usuario_id;
      if (!userMap.has(userId)) {
        userMap.set(userId, { total: 0, count: 0 });
      }
      const u = userMap.get(userId)!;
      u.total += saleTotal;
      u.count += 1;

      const dateStr = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Mexico_City', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).format(s.fecha);
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { rev: 0, count: 0 });
      }
      const dMapVal = dateMap.get(dateStr)!;
      dMapVal.rev += saleTotal;
      dMapVal.count += 1;

      for (const d of s.detalles) {
        const pCost = Number(d.producto.costo) || 0;
        const pRevenue = Number(d.precio_unitario_historico) * d.cantidad;
        const pCostTotal = pCost * d.cantidad;
        const pCategory = d.producto.categoria || 'Sin Categoría';
        
        totalCosts += pCostTotal;
        categoryMap.set(pCategory, (categoryMap.get(pCategory) || 0) + pRevenue);

        const productId = d.producto_id;
        if (!productMap.has(productId)) {
         productMap.set(productId, {
            name: d.producto.nombre,
            category: d.producto.categoria,
            units: 0,
            revenue: 0,
            costs: 0
          });
        }
        const p = productMap.get(productId)!;
        p.units += d.cantidad;
        p.revenue += pRevenue;
        p.costs += pCostTotal;
      }
    }

    for (const g of gastos) {
      const amount = Number(g.monto) || 0;
      totalExpenses += amount;
      
      expenseCategoryMap.set(g.categoria, (expenseCategoryMap.get(g.categoria) || 0) + amount);

      const monthKey = new Intl.DateTimeFormat('es-MX', { 
        timeZone: 'America/Mexico_City', 
        year: 'numeric', 
        month: 'long' 
      }).format(g.fecha);

      if (!monthlyBalanceMap.has(monthKey)) {
          monthlyBalanceMap.set(monthKey, { revenue: 0, fixed: 0, variable: 0 });
      }
      
      const isFixed = g.categoria === 'RENTA' || g.categoria === 'NOMINA';
      if (isFixed) {
          monthlyBalanceMap.get(monthKey)!.fixed += amount;
      } else {
          monthlyBalanceMap.get(monthKey)!.variable += amount;
      }
    }

    const branchIds = Array.from(branchMap.keys());
    const userIds = Array.from(userMap.keys());
    
    const [branches, users] = await Promise.all([
       branchIds.length > 0 ? db.sucursal.findMany({ where: { id: { in: branchIds } } }) : [],
       userIds.length > 0 ? db.user.findMany({ where: { id: { in: userIds } } }) : []
    ]);
    
    const branchNameMap = new Map(branches.map((b: any) => [b.id, b.nombre]));
    const userNameMap = new Map(users.map((u: any) => [u.id, u.name || u.email]));

    const branchSales = branchIds.map(id => ({
       branchId: id,
       branchName: branchNameMap.get(id) || "Desconocida",
       totalSales: branchMap.get(id)!.total,
       transactionCount: branchMap.get(id)!.count
    })).sort((a,b) => b.totalSales - a.totalSales);

    const userSales = userIds.map(id => ({
       userId: id,
       userName: userNameMap.get(id) || "Usuario",
       totalSales: userMap.get(id)!.total,
       transactionCount: userMap.get(id)!.count
    })).sort((a,b) => b.totalSales - a.totalSales);

    const dateSales = Array.from(dateMap.entries()).map(([date, val]) => ({
        date,
        totalSales: val.rev,
        orders: val.count
    })).sort((a,b) => a.date.localeCompare(b.date));

    const topProducts = Array.from(productMap.entries()).map(([id, p]) => ({
        productId: id,
        productName: p.name,
        category: p.category,
        unitsSold: p.units,
        revenue: p.revenue,
        grossMargin: p.revenue - p.costs
    })).sort((a,b) => b.revenue - a.revenue).slice(0, 15);

    const catColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const categorySales: CategoryPerformance[] = Array.from(categoryMap.entries())
      .map(([name, value], i) => ({
        name,
        value,
        color: catColors[i % catColors.length]
      }))
      .sort((a,b) => b.value - a.value);

    const expensesByCategory: CategoryPerformance[] = Array.from(expenseCategoryMap.entries())
      .map(([name, value], i) => ({
        name,
        value,
        color: catColors[(i + 2) % catColors.length]
      }))
      .sort((a,b) => b.value - a.value);

    const monthlyBalance = Array.from(monthlyBalanceMap.entries()).map(([month, val]) => ({
        month,
        revenue: val.revenue,
        fixedExpenses: val.fixed,
        variableExpenses: val.variable,
        profit: val.revenue - val.fixed - val.variable
    })).reverse();

    const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const grossProfit = totalRevenue - totalCosts;
    const netProfit = grossProfit - totalExpenses;
    const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      summary: {
         totalRevenue,
         totalTransactions,
         averageTicket,
         totalCosts,
         totalExpenses,
         grossProfit,
         netProfit,
         marginPercent
      },
      branchSales,
      userSales,
      dateSales,
      topProducts,
      categorySales,
      expensesByCategory,
      monthlyBalance
    };
  } catch (err) {
    console.error("[Analytics] Error en getAnalyticsData:", err);
    return {
      summary: { totalRevenue: 0, totalTransactions: 0, averageTicket: 0, totalCosts: 0, totalExpenses: 0, grossProfit: 0, netProfit: 0, marginPercent: 0 },
      branchSales: [], userSales: [], dateSales: [], topProducts: [], categorySales: [], expensesByCategory: [], monthlyBalance: []
    };
  }
}

export async function getFilterOptions() {
   const [sucursales, usuarios] = await Promise.all([
      db.sucursal.findMany({ select: { id: true, nombre: true } }),
      db.user.findMany({ select: { id: true, name: true, email: true } })
   ]);

   return { sucursales, usuarios };
}

export async function getInventoryAnalytics(): Promise<InventoryAnalytics> {
    const products = await db.producto.findMany({
        include: {
            inventario: {
                select: { cantidad: true }
            }
        }
    });

    let totalValueAtCost = 0;
    let totalUnits = 0;
    let criticalItems = 0;
    let lowStockItems = 0;

    for (const p of products) {
        const units = (p as any).inventario.reduce((acc: number, inv: any) => acc + inv.cantidad, 0);
        const cost = Number((p as any).costo) || 0;
        
        totalUnits += units;
        totalValueAtCost += (units * cost);
        
        if ((p as any).isCritical) criticalItems++;
        if (units < 5) lowStockItems++;
    }

    return {
        totalValueAtCost,
        totalUnits,
        criticalItems,
        lowStockItems
    };
}
