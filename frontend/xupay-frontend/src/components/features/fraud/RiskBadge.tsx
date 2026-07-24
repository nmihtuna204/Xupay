import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/mocks/data/fraud";

const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: "border-success/40 text-success",
  MEDIUM: "border-warning/40 text-warning",
  HIGH: "border-[#ec835a]/40 text-[#ec835a]",
  CRITICAL: "border-error/40 text-error",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", RISK_STYLES[level])}>
      {level.toLowerCase()}
    </Badge>
  );
}
