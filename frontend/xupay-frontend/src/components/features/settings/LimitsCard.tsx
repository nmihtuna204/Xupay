import { DetailField } from "@/components/common/DetailField";
import { formatCurrencyFromCents } from "@/lib/format";
import type { UserLimitsResponse } from "@/lib/api/user-service/profile";

export function LimitsCard({ limits }: { limits: UserLimitsResponse }) {
  return (
    <div className="panel p-6">
      <p className="font-medium">Transaction limits</p>
      <p className="mt-1 text-sm text-muted-foreground">Based on your KYC tier ({limits.kycTier}).</p>
      <div className="mt-5 grid grid-cols-2 gap-5">
        <DetailField label="Daily send limit" value={formatCurrencyFromCents(limits.dailySendLimitCents)} />
        <DetailField
          label="Daily receive limit"
          value={formatCurrencyFromCents(limits.dailyReceiveLimitCents)}
        />
        <DetailField
          label="Single transaction max"
          value={formatCurrencyFromCents(limits.singleTransactionMaxCents)}
        />
        <DetailField
          label="Monthly volume limit"
          value={formatCurrencyFromCents(limits.monthlyVolumeLimitCents)}
        />
        <DetailField label="Max transactions / day" value={limits.maxTransactionsPerDay} />
        <DetailField label="Max transactions / hour" value={limits.maxTransactionsPerHour} />
      </div>
    </div>
  );
}
