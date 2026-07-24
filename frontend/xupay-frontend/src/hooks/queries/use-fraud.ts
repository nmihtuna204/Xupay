"use client";

import { useQuery } from "@tanstack/react-query";
import { mockFetch } from "@/mocks/mock-fetch";
import { fraudKeys } from "@/lib/query-keys";
import type { FraudAlert, FraudMetrics, RiskLevel } from "@/mocks/data/fraud";
import type { PagedResult } from "@/mocks/handlers/paginate";

export function useFraudMetrics() {
  return useQuery({
    queryKey: [...fraudKeys.all, "metrics"],
    queryFn: () => mockFetch<FraudMetrics>("/mock-api/fraud/metrics"),
  });
}

export function useFraudAlerts(params: { page: number; size: number; riskLevel?: RiskLevel }) {
  return useQuery({
    queryKey: fraudKeys.alerts(params),
    queryFn: () =>
      mockFetch<PagedResult<FraudAlert>>("/mock-api/fraud/alerts", {
        page: params.page,
        size: params.size,
        riskLevel: params.riskLevel,
      }),
    placeholderData: (prev) => prev,
  });
}
