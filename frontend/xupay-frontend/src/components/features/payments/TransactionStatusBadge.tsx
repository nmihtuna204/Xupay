import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/lib/api/payment-service/payments";

const STATUS_STYLES: Record<TransactionStatus, string> = {
  COMPLETED: "border-success/40 text-success",
  PROCESSING: "border-primary/40 text-primary",
  REVIEW: "border-warning/40 text-warning",
  FAILED: "border-error/40 text-error",
  BLOCKED: "border-error/40 text-error",
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  COMPLETED: "Completed",
  PROCESSING: "Processing",
  REVIEW: "In review",
  FAILED: "Failed",
  BLOCKED: "Blocked",
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
