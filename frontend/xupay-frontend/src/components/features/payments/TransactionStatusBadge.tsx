import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import type { TransactionStatus } from "@/lib/api/payment-service/payments";

const CONFIG: Record<TransactionStatus, { tone: StatusTone; label: string }> = {
  COMPLETED: { tone: "success", label: "Completed" },
  PROCESSING: { tone: "info", label: "Processing" },
  REVIEW: { tone: "warning", label: "In review" },
  FAILED: { tone: "error", label: "Failed" },
  BLOCKED: { tone: "error", label: "Blocked" },
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const { tone, label } = CONFIG[status] ?? { tone: "neutral" as StatusTone, label: status };
  return <StatusBadge tone={tone} label={label} />;
}
