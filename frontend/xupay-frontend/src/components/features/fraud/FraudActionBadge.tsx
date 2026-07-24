import { Ban, CheckCircle2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FraudAction } from "@/mocks/data/fraud";

const CONFIG: Record<FraudAction, { icon: typeof Ban; label: string; className: string }> = {
  ALLOW: { icon: CheckCircle2, label: "Allowed", className: "text-success" },
  REVIEW: { icon: Eye, label: "Review", className: "text-warning" },
  BLOCK: { icon: Ban, label: "Blocked", className: "text-error" },
};

export function FraudActionBadge({ action }: { action: FraudAction }) {
  const { icon: Icon, label, className } = CONFIG[action];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", className)}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
