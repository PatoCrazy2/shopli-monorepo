"use server";

import { getSaleDetails } from "./queries";

export async function fetchSaleDetails(ventaId: string) {
  return await getSaleDetails(ventaId);
}
