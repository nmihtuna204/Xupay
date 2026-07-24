"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyContacts } from "@/lib/api/user-service/contacts";
import { contactKeys } from "@/lib/query-keys";

export function useContacts() {
  return useQuery({
    queryKey: contactKeys.list(),
    queryFn: getMyContacts,
    staleTime: 30_000,
  });
}
