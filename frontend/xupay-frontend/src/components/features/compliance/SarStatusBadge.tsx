import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import type { SarStatus } from "@/mocks/data/compliance";

const CONFIG: Record<SarStatus, { tone: StatusTone; label: string }> = {
  DRAFT: { tone: "neutral", label: "Draft" },
  SUBMITTED: { tone: "info", label: "Submitted" },
  UNDER_REVIEW: { tone: "warning", label: "Under review" },
  CLOSED: { tone: "success", label: "Closed" },
};

export function SarStatusBadge({ status }: { status: SarStatus }) {
  const { tone, label } = CONFIG[status];
  return <StatusBadge tone={tone} label={label} />;
}
