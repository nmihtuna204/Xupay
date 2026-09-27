import { StatusBadge, type StatusTone } from "@/components/common/StatusBadge";
import type { AuditCategory } from "@/mocks/data/audit-log";

const TONE: Record<AuditCategory, StatusTone> = {
  AUTH: "info",
  PAYMENT: "success",
  WALLET: "warning",
  KYC: "violet",
  ADMIN: "error",
};

// Explicit labels rather than lowercasing the enum: StatusBadge's CSS
// `capitalize` would otherwise render the KYC acronym as "Kyc".
const LABEL: Record<AuditCategory, string> = {
  AUTH: "Auth",
  PAYMENT: "Payment",
  WALLET: "Wallet",
  KYC: "KYC",
  ADMIN: "Admin",
};

export function AuditCategoryBadge({ category }: { category: AuditCategory }) {
  return <StatusBadge tone={TONE[category]} label={LABEL[category]} />;
}
