import { Snowflake, Wallet as WalletIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyFromCents } from "@/lib/format";
import type { WalletBalanceResponse } from "@/lib/api/payment-service/wallets";

export function WalletCard({ wallet }: { wallet: WalletBalanceResponse }) {
  return (
    <div className="glass-card relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-gradient-to-br from-accent-from/20 to-accent-to/10 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <WalletIcon className="size-4" />
          Wallet balance
        </div>
        {wallet.isFrozen && (
          <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
            <Snowflake className="size-3" /> Frozen
          </Badge>
        )}
      </div>
      <p className="figure-lg relative mt-3">
        {formatCurrencyFromCents(wallet.balanceCents, wallet.currency)}
      </p>
      <p className="relative mt-1 text-xs text-muted-foreground">
        Wallet ID {wallet.walletId.slice(0, 8)}… · {wallet.currency}
      </p>
    </div>
  );
}
