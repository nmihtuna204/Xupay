import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import type { DocumentVerificationStatus } from "@/lib/api/user-service/kyc";

const TONE: Record<DocumentVerificationStatus, StatusTone> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "error",
  EXPIRED: "neutral",
};

export function KycStatusBadge({ status }: { status: DocumentVerificationStatus }) {
  return <StatusBadge tone={TONE[status]} label={status.toLowerCase()} />;
}
