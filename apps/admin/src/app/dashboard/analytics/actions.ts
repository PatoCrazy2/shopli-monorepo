"use server";

import { AnalyticsFilters, AnalyticsData } from "./types";
import { getAnalyticsData, getFilterOptions } from "./queries";
import { auth } from "@/lib/auth";

export async function fetchAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
    throw new Error("No tienes permisos para consultar analítica");
  }
  return await getAnalyticsData(filters);
}

export async function fetchFilterOptions() {
  const session = await auth();
  if (!session?.user?.empresa_id) throw new Error("No autorizado");
  if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
    throw new Error("No tienes permisos para consultar opciones de analítica");
  }
  return await getFilterOptions();
}
