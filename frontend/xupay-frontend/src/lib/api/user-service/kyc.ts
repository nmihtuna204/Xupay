import { userServiceClient } from "../client-factory";

export type DocumentType =
  | "PASSPORT"
  | "DRIVERS_LICENSE"
  | "NATIONAL_ID"
  | "UTILITY_BILL"
  | "SELFIE";

export type DocumentVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface KycDocumentResponse {
  id: string;
  userId: string;
  documentType: DocumentType;
  documentNumber?: string;
  documentCountry?: string;
  fileUrl: string;
  verificationStatus: DocumentVerificationStatus;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
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
