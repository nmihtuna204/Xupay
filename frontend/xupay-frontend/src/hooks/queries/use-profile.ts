"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyProfile, getMyLimits } from "@/lib/api/user-service/profile";
import { profileKeys } from "@/lib/query-keys";

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: getMyProfile,
    staleTime: 30_000,
  });
}

export function useMyLimits() {
  return useQuery({
    queryKey: profileKeys.limits(),
    queryFn: getMyLimits,
    staleTime: 60_000,
  });
}
