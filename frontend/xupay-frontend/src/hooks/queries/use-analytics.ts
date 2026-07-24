"use client";

import { useQuery } from "@tanstack/react-query";
import { mockFetch } from "@/mocks/mock-fetch";
import { analyticsKeys } from "@/lib/query-keys";
import type { AnalyticsOverview } from "@/mocks/data/analytics";

export function useAnalytics(range: string) {
  return useQuery({
    queryKey: analyticsKeys.overview(range),
    queryFn: () => mockFetch<AnalyticsOverview>("/mock-api/analytics/overview", { range }),
    placeholderData: (prev) => prev,
  });
}
