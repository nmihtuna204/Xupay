import { CheckCircle, Eye, Prohibit } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { FraudAction } from "@/mocks/data/fraud";

const CONFIG: Record<FraudAction, { icon: typeof Prohibit; label: string; className: string }> = {
  ALLOW: { icon: CheckCircle, label: "Allowed", className: "text-success" },
  REVIEW: { icon: Eye, label: "Review", className: "text-warning" },
  BLOCK: { icon: Prohibit, label: "Blocked", className: "text-error" },
};

export function FraudActionBadge({ action }: { action: FraudAction }) {
  const { icon: Icon, label, className } = CONFIG[action];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", className)}>
      <Icon weight="light" className="size-3.5" />
      {label}
    </span>
  );
}
