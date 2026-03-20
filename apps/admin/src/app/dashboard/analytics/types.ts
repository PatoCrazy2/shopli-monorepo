export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  sucursalId?: string;
  usuarioId?: string;
  estado?: "COMPLETADA" | "CANCELADA";
}

export interface MetricCard {
  label: string;
  value: number;
  format: "currency" | "number";
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
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  category: string | null;
  unitsSold: number;
  revenue: number;
  grossMargin: number; // revenue - costs
}

export interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageTicket: number;
    totalCosts: number;
    grossProfit: number;
  };
  branchSales: BranchSale[];
  userSales: UserSale[];
  dateSales: DateSale[];
  topProducts: ProductPerformance[];
}
