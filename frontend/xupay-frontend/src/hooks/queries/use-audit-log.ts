"use client";

import { useQuery } from "@tanstack/react-query";
import { mockFetch } from "@/mocks/mock-fetch";
import { auditKeys } from "@/lib/query-keys";
import type { AuditEntry, AuditCategory } from "@/mocks/data/audit-log";
import type { PagedResult } from "@/mocks/handlers/paginate";

export function useAuditLog(params: { page: number; size: number; category?: AuditCategory; q?: string }) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () =>
      mockFetch<PagedResult<AuditEntry>>("/mock-api/audit-log", {
        page: params.page,
        size: params.size,
        category: params.category,
        q: params.q,
      }),
    placeholderData: (prev) => prev,
  });
}
