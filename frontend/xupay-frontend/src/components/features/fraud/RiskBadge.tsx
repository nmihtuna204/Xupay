import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import type { RiskLevel } from "@/mocks/data/fraud";

const TONE: Record<RiskLevel, StatusTone> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "serious",
  CRITICAL: "error",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  // DOM label kept lowercase (StatusBadge only capitalizes visually).
  return <StatusBadge tone={TONE[level]} label={level.toLowerCase()} />;
}
