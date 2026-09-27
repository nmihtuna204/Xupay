"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyKycDocuments, getPendingKycDocuments } from "@/lib/api/user-service/kyc";
import { kycKeys } from "@/lib/query-keys";

export function useKycDocuments() {
  return useQuery({
    queryKey: kycKeys.documents(),
    queryFn: getMyKycDocuments,
    staleTime: 30_000,
  });
}

/** The review queue. Only fetched for admins: everyone else gets a 403. */
export function usePendingKycDocuments(enabled: boolean) {
  return useQuery({
    queryKey: kycKeys.pending(),
    queryFn: getPendingKycDocuments,
    enabled,
    staleTime: 10_000,
  });
}
