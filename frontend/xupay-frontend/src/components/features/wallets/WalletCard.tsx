import { Snowflake } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyFromCents } from "@/lib/format";
import type { WalletBalanceResponse } from "@/lib/api/payment-service/wallets";

export function WalletCard({ wallet }: { wallet: WalletBalanceResponse }) {
  return (
    <div className="panel p-8 sm:p-10">
      <div className="flex items-start justify-between">
        <p className="kicker">Wallet balance</p>
        {wallet.isFrozen && (
          <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
            <Snowflake weight="light" className="size-3" /> Frozen
          </Badge>
        )}
      </div>
      <p className="figure-lg mt-4 text-[clamp(2.5rem,6vw,4.5rem)] leading-none">
        {formatCurrencyFromCents(wallet.balanceCents, wallet.currency)}
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Wallet ID {wallet.walletId.slice(0, 8)}… · {wallet.currency}
      </p>
    </div>
  );
}
