import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SarStatus } from "@/mocks/data/compliance";

const STYLES: Record<SarStatus, string> = {
  DRAFT: "border-border text-muted-foreground",
  SUBMITTED: "border-primary/40 text-primary",
  UNDER_REVIEW: "border-warning/40 text-warning",
  CLOSED: "border-success/40 text-success",
};

const LABELS: Record<SarStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CLOSED: "Closed",
};

export function SarStatusBadge({ status }: { status: SarStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
