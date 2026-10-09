import { db, Prisma } from "@shopli/db";
import { AnalyticsFilters, AnalyticsData, CategoryPerformance, ProductPerformance } from "./types";
import { auth } from "@/lib/auth";

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

export async function getAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
    throw new Error("No tienes permisos para consultar analítica");
  }
  const empresaId = session.user.empresa_id;

  try {
    // 1. Validaciones de alcance multi-tenant
    if (filters.sucursalId) {
      const sucursal = await db.sucursal.findUnique({
        where: { id: filters.sucursalId },
        select: { empresa_id: true }
      });
      if (!sucursal || sucursal.empresa_id !== empresaId) {
        throw new Error("No autorizado");
      }
    }

    if (filters.usuarioId) {
      const usr = await db.user.findUnique({
        where: { id: filters.usuarioId },
        select: { empresa_id: true }
      });
      if (!usr || usr.empresa_id !== empresaId) {
        throw new Error("No autorizado");
      }
    }

    // 2. Validación y clamping de fechas (por defecto Hoy CDMX; máximo 366 días para proteger Neon)
    const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
    const todayStr = getTodayMexicoCity();
    const startDateClean = filters.startDate && DATE_REGEX.test(filters.startDate) ? filters.startDate : undefined;
    const endDateClean = filters.endDate && DATE_REGEX.test(filters.endDate) ? filters.endDate : undefined;

    let sDate: Date;
    let eDate: Date;

    if (startDateClean && endDateClean) {
      const [minDateStr, maxDateStr] =
        startDateClean <= endDateClean
          ? [startDateClean, endDateClean]
          : [endDateClean, startDateClean];

      sDate = new Date(`${minDateStr}T00:00:00.000-06:00`);
      eDate = new Date(`${maxDateStr}T23:59:59.999-06:00`);

      const diffMs = eDate.getTime() - sDate.getTime();
      const maxMs = 366 * 24 * 60 * 60 * 1000;
      if (diffMs > maxMs) {
        sDate = new Date(eDate.getTime() - maxMs);
      }
    } else if (startDateClean) {
      sDate = new Date(`${startDateClean}T00:00:00.000-06:00`);
      eDate = new Date(sDate.getTime() + 366 * 24 * 60 * 60 * 1000);
    } else if (endDateClean) {
      eDate = new Date(`${endDateClean}T23:59:59.999-06:00`);
      sDate = new Date(eDate.getTime() - 366 * 24 * 60 * 60 * 1000);
    } else {
      sDate = new Date(`${todayStr}T00:00:00.000-06:00`);
      eDate = new Date(`${todayStr}T23:59:59.999-06:00`);
    }

    // 3. Construcción de condiciones SQL parametrizadas para Ventas
    const salesConditions: Prisma.Sql[] = [
      Prisma.sql`s.empresa_id = ${empresaId}`
    ];

    if (filters.estado) {
      salesConditions.push(Prisma.sql`v.estado = ${filters.estado}::"EstadoVenta"`);
    }

    salesConditions.push(Prisma.sql`v.fecha >= ${sDate} AND v.fecha <= ${eDate}`);

    if (filters.sucursalId) {
      salesConditions.push(Prisma.sql`v.sucursal_id = ${filters.sucursalId}`);
    }

    if (filters.usuarioId) {
      salesConditions.push(Prisma.sql`t.usuario_id = ${filters.usuarioId}`);
    }

    const salesWhereSql = Prisma.join(salesConditions, " AND ");

    // 4. Construcción de condiciones SQL parametrizadas para Gastos
    const gastosConditions: Prisma.Sql[] = [
      Prisma.sql`s.empresa_id = ${empresaId}`
    ];

    if (filters.sucursalId) {
      gastosConditions.push(Prisma.sql`g.sucursal_id = ${filters.sucursalId}`);
    }

    if (sDate && eDate) {
      gastosConditions.push(Prisma.sql`g.fecha >= ${sDate} AND g.fecha <= ${eDate}`);
    }

    const gastosWhereSql = Prisma.join(gastosConditions, " AND ");

    // 5. Ejecución paralela de consultas agregadas en PostgreSQL (Neon)
    const [
      totalsRes,
      totalCostsRes,
      branchSalesRes,
      userSalesRes,
      dateSalesRes,
      productsRes,
      categorySalesRes,
      monthlySalesRes,
      gastosRes
    ] = await Promise.all([
      // Totales de ventas (revenue y transacciones)
      db.$queryRaw<{ totalRevenue: number | null; totalTransactions: number | null }[]>`
        SELECT 
          COALESCE(SUM(v.total), 0)::float as "totalRevenue",
          COUNT(v.id)::int as "totalTransactions"
        FROM "Venta" v
        JOIN "Turno" t ON v.turno_id = t.id
        JOIN "Sucursal" s ON v.sucursal_id = s.id
        WHERE ${salesWhereSql}
      `,

      // Total costos (COGS) calculado nativamente en Postgres
      db.$queryRaw<{ totalCosts: number | null }[]>`
        SELECT 
          COALESCE(SUM(d.cantidad * p.costo), 0)::float as "totalCosts"
        FROM "Detalle_Venta" d
        JOIN "Producto" p ON d.producto_id = p.id
        JOIN "Venta" v ON d.venta_id = v.id
        JOIN "Turno" t ON v.turno_id = t.id
        JOIN "Sucursal" s ON v.sucursal_id = s.id
        WHERE ${salesWhereSql}
      `,

      // Ventas por sucursal
      db.$queryRaw<{ branchId: string; branchName: string; totalSales: number; transactionCount: number }[]>`
        SELECT 
          v.sucursal_id as "branchId",
          s.nombre as "branchName",
          COALESCE(SUM(v.total), 0)::float as "totalSales",
          COUNT(v.id)::int as "transactionCount"
        FROM "Venta" v
        JOIN "Turno" t ON v.turno_id = t.id
        JOIN "Sucursal" s ON v.sucursal_id = s.id
        WHERE ${salesWhereSql}
        GROUP BY v.sucursal_id, s.nombre
        ORDER BY "totalSales" DESC
      `,

      // Ventas por cajero / staff
      db.$queryRaw<{ userId: string; userName: string; totalSales: number; transactionCount: number }[]>`
        SELECT 
          t.usuario_id as "userId",
          COALESCE(u.name, 'Cajero') as "userName",
          COALESCE(SUM(v.total), 0)::float as "totalSales",
          COUNT(v.id)::int as "transactionCount"
        FROM "Venta" v
        JOIN "Turno" t ON v.turno_id = t.id
        JOIN "User" u ON t.usuario_id = u.id
        JOIN "Sucursal" s ON v.sucursal_id = s.id
        WHERE ${salesWhereSql}
        GROUP BY t.usuario_id, u.name
        ORDER BY "totalSales" DESC
      `,

      // Ventas por fecha (Timezone America/Mexico_City)
      db.$queryRaw<{ date: string; totalSales: number; orders: number }[]>`
        SELECT 
          TO_CHAR(v.fecha AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD') as date,
          COALESCE(SUM(v.total), 0)::float as "totalSales",
          COUNT(v.id)::int as orders
        FROM "Venta" v
        JOIN "Turno" t ON v.turno_id = t.id
        JOIN "Sucursal" s ON v.sucursal_id = s.id
        WHERE ${salesWhereSql}
        GROUP BY 1
        ORDER BY 1 ASC
      `,

      // Desempeño por producto y margen bruto con LIMIT 20 directo en DB
      db.$queryRaw<{
        productId: string;
        productName: string;
        category: string | null;
        unitsSold: number;
        revenue: number;
        grossMargin: number;
      }[]>`
        SELECT 
          p.id as "productId",
          p.nombre as "productName",
          p.categoria as "category",
          COALESCE(SUM(d.cantidad), 0)::int as "unitsSold",
          COALESCE(SUM(d.cantidad * d.precio_unitario_historico), 0)::float as revenue,
          COALESCE(SUM(d.cantidad * (d.precio_unitario_historico - p.costo)), 0)::float as "grossMargin"
        FROM "Detalle_Venta" d
        JOIN "Producto" p ON d.producto_id = p.id
        JOIN "Venta" v ON d.venta_id = v.id
        JOIN "Turno" t ON v.turno_id = t.id
        JOIN "Sucursal" s ON v.sucursal_id = s.id
        WHERE ${salesWhereSql}
        GROUP BY p.id, p.nombre, p.categoria
        ORDER BY revenue DESC
        LIMIT 20
      `,

      // Ventas agrupadas por categoría en SQL
      db.$queryRaw<{ name: string; value: number }[]>`
        SELECT 
          COALESCE(p.categoria, 'Sin Categoría') as "name",
          COALESCE(SUM(d.cantidad * d.precio_unitario_historico), 0)::float as "value"
        FROM "Detalle_Venta" d
        JOIN "Producto" p ON d.producto_id = p.id
        JOIN "Venta" v ON d.venta_id = v.id
        JOIN "Turno" t ON v.turno_id = t.id
        JOIN "Sucursal" s ON v.sucursal_id = s.id
        WHERE ${salesWhereSql}
        GROUP BY p.categoria
        ORDER BY "value" DESC
      `,

      // Ventas agrupadas por mes para balance mensual
      db.$queryRaw<{ monthKey: string; revenue: number }[]>`
        SELECT 
          TO_CHAR(v.fecha AT TIME ZONE 'America/Mexico_City', 'YYYY-MM') as "monthKey",
          COALESCE(SUM(v.total), 0)::float as revenue
        FROM "Venta" v
        JOIN "Turno" t ON v.turno_id = t.id
        JOIN "Sucursal" s ON v.sucursal_id = s.id
        WHERE ${salesWhereSql}
        GROUP BY 1
        ORDER BY 1 ASC
      `,

      // Gastos agrupados por mes y categoría
      db.$queryRaw<{ monthKey: string; category: string; amount: number }[]>`
        SELECT 
          TO_CHAR(g.fecha AT TIME ZONE 'America/Mexico_City', 'YYYY-MM') as "monthKey",
          g.categoria::text as category,
          COALESCE(SUM(g.monto), 0)::float as amount
        FROM "Gasto" g
        JOIN "Sucursal" s ON g.sucursal_id = s.id
        WHERE ${gastosWhereSql}
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `
    ]);

    // 6. Procesamiento de totales y métricas
    const totalRevenue = Number(totalsRes[0]?.totalRevenue) || 0;
    const totalTransactions = Number(totalsRes[0]?.totalTransactions) || 0;
    const totalCosts = Number(totalCostsRes[0]?.totalCosts) || 0;

    const topProducts: ProductPerformance[] = productsRes.map(p => ({
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      unitsSold: Number(p.unitsSold) || 0,
      revenue: Number(p.revenue) || 0,
      grossMargin: Number(p.grossMargin) || 0
    }));

    const catColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const categorySales: CategoryPerformance[] = categorySalesRes.map((c, i) => ({
      name: c.name,
      value: Number(c.value) || 0,
      color: catColors[i % catColors.length]
    }));

    // 7. Procesamiento de Gastos y Balance Mensual
    let totalExpenses = 0;
    const expenseCategoryMap = new Map<string, number>();
    const monthlyBalanceMap = new Map<string, { revenue: number; fixed: number; variable: number }>();

    for (const g of gastosRes) {
      const amt = Number(g.amount) || 0;
      totalExpenses += amt;
      expenseCategoryMap.set(g.category, (expenseCategoryMap.get(g.category) || 0) + amt);

      if (!monthlyBalanceMap.has(g.monthKey)) {
        monthlyBalanceMap.set(g.monthKey, { revenue: 0, fixed: 0, variable: 0 });
      }

      const isFixed = g.category === "RENTA" || g.category === "NOMINA";
      if (isFixed) {
        monthlyBalanceMap.get(g.monthKey)!.fixed += amt;
      } else {
        monthlyBalanceMap.get(g.monthKey)!.variable += amt;
      }
    }

    for (const s of monthlySalesRes) {
      if (!monthlyBalanceMap.has(s.monthKey)) {
        monthlyBalanceMap.set(s.monthKey, { revenue: 0, fixed: 0, variable: 0 });
      }
      monthlyBalanceMap.get(s.monthKey)!.revenue += Number(s.revenue) || 0;
    }

    const expensesByCategory: CategoryPerformance[] = Array.from(expenseCategoryMap.entries())
      .map(([name, value], i) => ({
        name,
        value,
        color: catColors[(i + 2) % catColors.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Formatear meses al formato es-MX
    const sortedMonthKeys = Array.from(monthlyBalanceMap.keys()).sort().reverse();
    const monthlyBalance = sortedMonthKeys.map(key => {
      const [year, month] = key.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0));
      const monthLabel = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: 'long'
      }).format(date);

      const item = monthlyBalanceMap.get(key)!;
      return {
        month: monthLabel,
        revenue: item.revenue,
        fixedExpenses: item.fixed,
        variableExpenses: item.variable,
        profit: item.revenue - item.fixed - item.variable
      };
    });

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
      branchSales: branchSalesRes.map(b => ({
        branchId: b.branchId,
        branchName: b.branchName || "Desconocida",
        totalSales: Number(b.totalSales) || 0,
        transactionCount: Number(b.transactionCount) || 0
      })),
      userSales: userSalesRes.map(u => ({
        userId: u.userId,
        userName: u.userName || "Usuario",
        totalSales: Number(u.totalSales) || 0,
        transactionCount: Number(u.transactionCount) || 0
      })),
      dateSales: dateSalesRes.map(d => ({
        date: d.date,
        totalSales: Number(d.totalSales) || 0,
        orders: Number(d.orders) || 0
      })),
      topProducts,
      categorySales,
      expensesByCategory,
      monthlyBalance
    };
  } catch (err) {
    console.error(`[Analytics][Error][Empresa: ${empresaId}] Error en getAnalyticsData:`, err);
    throw new Error(err instanceof Error ? err.message : "Error al procesar la analítica");
  }
}

export async function getFilterOptions() {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
    throw new Error("No tienes permisos para consultar opciones de analítica");
  }
  const empresaId = session.user.empresa_id;

  const [sucursales, usuarios] = await Promise.all([
    db.sucursal.findMany({ 
      where: { empresa_id: empresaId, activo: true },
      select: { id: true, nombre: true } 
    }),
    db.user.findMany({ 
      where: { empresa_id: empresaId, active: true },
      select: { id: true, name: true } 
    })
  ]);

  return { 
    sucursales, 
    usuarios: usuarios.map(u => ({
      id: u.id,
      name: u.name || "Cajero"
    }))
  };
}
