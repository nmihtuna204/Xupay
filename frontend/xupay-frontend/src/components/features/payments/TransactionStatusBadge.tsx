import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import type { TransactionStatus } from "@/lib/api/payment-service/payments";

const CONFIG: Record<TransactionStatus, { tone: StatusTone; label: string }> = {
  COMPLETED: { tone: "success", label: "Completed" },
  PENDING: { tone: "info", label: "Pending" },
  PROCESSING: { tone: "info", label: "Processing" },
  FAILED: { tone: "error", label: "Failed" },
  CANCELLED: { tone: "neutral", label: "Cancelled" },
  REVERSED: { tone: "warning", label: "Reversed" },
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const { tone, label } = CONFIG[status] ?? { tone: "neutral" as StatusTone, label: status };
  return <StatusBadge tone={tone} label={label} />;
}
