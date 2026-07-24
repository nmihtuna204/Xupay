"use client";

import { useQuery } from "@tanstack/react-query";
import { mockFetch } from "@/mocks/mock-fetch";
import { complianceKeys } from "@/lib/query-keys";
import type { SarReport, SarStatus } from "@/mocks/data/compliance";
import type { PagedResult } from "@/mocks/handlers/paginate";

export function useSarReports(params: { page: number; size: number; status?: SarStatus }) {
  return useQuery({
    queryKey: complianceKeys.reports(params),
    queryFn: () =>
      mockFetch<PagedResult<SarReport>>("/mock-api/compliance/reports", {
        page: params.page,
        size: params.size,
        status: params.status,
      }),
    placeholderData: (prev) => prev,
  });
}

export function useSarReport(id: string) {
  return useQuery({
    queryKey: complianceKeys.report(id),
    queryFn: () => mockFetch<SarReport>(`/mock-api/compliance/reports/${id}`),
    enabled: !!id,
  });
}
