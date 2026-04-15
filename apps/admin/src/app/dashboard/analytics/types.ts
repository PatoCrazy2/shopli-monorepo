export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  sucursalId?: string;
  usuarioId?: string;
  estado?: "COMPLETADA" | "CANCELADA";
}

export interface MetricCardData {
  label: string;
  value: number;
  format: "currency" | "number" | "percentage";
  trend?: number; // percentage change
  description?: string;
}

export interface BranchSale {
  branchId: string;
  branchName: string;
  totalSales: number;
  transactionCount: number;
}

export interface UserSale {
  userId: string;
  userName: string;
  totalSales: number;
  transactionCount: number;
}

export interface DateSale {
  date: string; // ISO or YYYY-MM-DD
  totalSales: number;
  orders: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  category: string | null;
  unitsSold: number;
  revenue: number;
  grossMargin: number; // revenue - costs
}

export interface CategoryPerformance {
    name: string;
    value: number;
    color: string;
}

export interface MonthlyBalance {
  month: string;
  revenue: number;
  fixedExpenses: number;
  variableExpenses: number;
  profit: number;
}

export interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageTicket: number;
    totalCosts: number;
    totalExpenses: number; // Gastos operativos
    grossProfit: number;
    netProfit: number; // GrossProfit - TotalExpenses
    marginPercent: number;
  };
  branchSales: BranchSale[];
  userSales: UserSale[];
  dateSales: DateSale[];
  topProducts: ProductPerformance[];
  categorySales: CategoryPerformance[];
  expensesByCategory: CategoryPerformance[];
  monthlyBalance: MonthlyBalance[];
}

export interface InventoryAnalytics {
    totalValueAtCost: number;
    totalUnits: number;
    lowStockItems: number;
    criticalItems: number;
}
