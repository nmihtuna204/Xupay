"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveKycDocument,
  rejectKycDocument,
  uploadKycDocument,
  type ApproveKycRequest,
  type UploadKycDocumentRequest,
} from "@/lib/api/user-service/kyc";
import { authKeys, kycKeys } from "@/lib/query-keys";

export function useUploadKycDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadKycDocumentRequest) => uploadKycDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.all });
      // Re-submitting after a rejection moves the account back to PENDING.
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
}

export function useApproveKycDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, ...payload }: ApproveKycRequest & { documentId: string }) =>
      approveKycDocument(documentId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: kycKeys.all }),
  });
}

export function useRejectKycDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, reason }: { documentId: string; reason: string }) =>
      rejectKycDocument(documentId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: kycKeys.all }),
  });
}
