"use server";

import { AnalyticsFilters, AnalyticsData } from "./types";
import { getAnalyticsData, getFilterOptions } from "./queries";

export async function fetchAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
  return await getAnalyticsData(filters);
}

export async function fetchFilterOptions() {
  return await getFilterOptions();
}
