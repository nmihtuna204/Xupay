"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadKycDocument, type UploadKycDocumentRequest } from "@/lib/api/user-service/kyc";
import { kycKeys } from "@/lib/query-keys";

export function useUploadKycDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadKycDocumentRequest) => uploadKycDocument(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: kycKeys.all }),
  });
}
