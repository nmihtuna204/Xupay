"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyKycDocuments } from "@/lib/api/user-service/kyc";
import { kycKeys } from "@/lib/query-keys";

export function useKycDocuments() {
  return useQuery({
    queryKey: kycKeys.documents(),
    queryFn: getMyKycDocuments,
    staleTime: 30_000,
  });
}
