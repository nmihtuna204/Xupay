import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AuditCategory } from "@/mocks/data/audit-log";

const STYLES: Record<AuditCategory, string> = {
  AUTH: "border-primary/40 text-primary",
  PAYMENT: "border-success/40 text-success",
  WALLET: "border-[#c98500]/40 text-[#c98500]",
  KYC: "border-[#9085e9]/40 text-[#9085e9]",
  ADMIN: "border-error/40 text-error",
};

export function AuditCategoryBadge({ category }: { category: AuditCategory }) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", STYLES[category])}>
      {category.toLowerCase()}
    </Badge>
  );
}
