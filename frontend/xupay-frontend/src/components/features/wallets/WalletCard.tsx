import { Snowflake } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyFromCents } from "@/lib/format";
import type { WalletBalanceResponse } from "@/lib/api/payment-service/wallets";

export function WalletCard({ wallet }: { wallet: WalletBalanceResponse }) {
  return (
    <div className="panel panel-lit p-6 sm:p-10">
      <div className="flex items-start justify-between">
        <p className="kicker">Wallet balance</p>
        {wallet.isFrozen && (
          <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
            <Snowflake weight="light" className="size-3" /> Frozen
          </Badge>
        )}
      </div>
      {/* The floor is sized for a phone: 2rem mono fits a nine-figure VND
          balance in a 390px viewport. The wrap is a last resort for a balance
          longer than that, so it can never be clipped by the card. */}
      <p className="figure-lg mt-4 text-[clamp(2rem,6vw,4.5rem)] leading-none [overflow-wrap:anywhere]">
        {formatCurrencyFromCents(wallet.balanceCents, wallet.currency)}
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Wallet ID {wallet.walletId.slice(0, 8)}… · {wallet.currency}
      </p>
    </div>
  );
}
