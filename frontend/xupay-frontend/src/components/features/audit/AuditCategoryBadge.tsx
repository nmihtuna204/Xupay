import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import type { AuditCategory } from "@/mocks/data/audit-log";

const TONE: Record<AuditCategory, StatusTone> = {
  AUTH: "info",
  PAYMENT: "success",
  WALLET: "warning",
  KYC: "violet",
  ADMIN: "error",
};

export function AuditCategoryBadge({ category }: { category: AuditCategory }) {
  // DOM label kept lowercase (StatusBadge only capitalizes visually).
  return <StatusBadge tone={TONE[category]} label={category.toLowerCase()} />;
}
