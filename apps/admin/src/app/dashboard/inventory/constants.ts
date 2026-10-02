export type StockOperation = "IN" | "OUT";

export const STOCK_IN_REASONS = [
  "COMPRA",
  "DEVOLUCION",
  "AJUSTE_POSITIVO",
] as const;
export type StockInReason = (typeof STOCK_IN_REASONS)[number];

export const STOCK_OUT_REASONS = [
  "MERMA",
  "DANO",
  "ROBO",
  "CONSUMO_INTERNO",
  "AJUSTE_NEGATIVO",
] as const;
export type StockOutReason = (typeof STOCK_OUT_REASONS)[number];

export type StockReason = StockInReason | StockOutReason;

export interface AdjustStockInput {
  productId: string;
  amount: number;
  operation: StockOperation;
  reason: StockReason;
  sucursalId: string;
  notes?: string;
}
