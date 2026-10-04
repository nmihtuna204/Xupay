import { userServiceClient } from "../client-factory";
import type { KycTier } from "./auth";

export type DocumentType =
  | "PASSPORT"
  | "DRIVERS_LICENSE"
  | "NATIONAL_ID"
  | "UTILITY_BILL"
  | "SELFIE";

export type DocumentVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface KycDocumentResponse {
  id: string;
  userId: string;
  documentType: DocumentType;
  documentNumber?: string;
  documentCountry?: string;
  fileUrl: string;
  verificationStatus: DocumentVerificationStatus;
  /** The reviewer's note; for a REJECTED document, the reason the user is shown. */
  verificationNotes?: string;
  createdAt: string;
}

export interface UploadKycDocumentRequest {
  documentType: DocumentType;
  documentNumber?: string;
  documentCountry?: string;
  fileUrl: string;
  // Required by the user-service: it validates the file's size and MIME type
  // server-side (verified against the live API — a request without these 400s
  // with "File size is required / MIME type is required").
  fileSizeBytes: number;
  mimeType: string;
}

export async function uploadKycDocument(
  payload: UploadKycDocumentRequest
): Promise<KycDocumentResponse> {
  const { data } = await userServiceClient.post<KycDocumentResponse>(
    "/api/kyc/upload-document",
    payload
  );
  return data;
}

export async function getMyKycDocuments(): Promise<KycDocumentResponse[]> {
  const { data } = await userServiceClient.get<KycDocumentResponse[]>("/api/kyc/documents");
  return data;
}

// ---- Review (ADMIN only; the API answers 403 to anyone else) -------------

export interface ApproveKycRequest {
  verificationNotes?: string;
  /** Tier to grant. Never lowers an existing tier; defaults to TIER_1. */
  upgradeTier?: KycTier;
}

export async function getPendingKycDocuments(): Promise<KycDocumentResponse[]> {
  const { data } = await userServiceClient.get<KycDocumentResponse[]>("/api/kyc/pending");
  return data;
}

export async function approveKycDocument(
  documentId: string,
  payload: ApproveKycRequest
): Promise<KycDocumentResponse> {
  const { data } = await userServiceClient.post<KycDocumentResponse>(
    `/api/kyc/${documentId}/approve`,
    payload
  );
  return data;
}

export async function rejectKycDocument(
  documentId: string,
  verificationNotes: string
): Promise<KycDocumentResponse> {
  const { data } = await userServiceClient.post<KycDocumentResponse>(
    `/api/kyc/${documentId}/reject`,
    { verificationNotes }
  );
  return data;
}
