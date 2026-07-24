import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentVerificationStatus } from "@/lib/api/user-service/kyc";

const STYLES: Record<DocumentVerificationStatus, string> = {
  APPROVED: "border-success/40 text-success",
  PENDING: "border-warning/40 text-warning",
  REJECTED: "border-error/40 text-error",
};

export function KycStatusBadge({ status }: { status: DocumentVerificationStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", STYLES[status])}>
      {status.toLowerCase()}
    </Badge>
  );
}
