import { formatCurrencyFromCents } from "@/lib/format";

/**
 * "You send / fee / they receive" for an internal transfer.
 *
 * XuPay is a domestic VND wallet, so there is no FX rate to show; inventing
 * one would be a claim the product cannot make. What a ledger-accurate wallet
 * can promise is that the first and last figures are identical, which is the
 * Ledger section's argument, so the card now sits there.
 */
const SEND_CENTS = 250_000_000;
const FEE_CENTS = 0;

export function TransferQuoteCard() {
  return (
    <div className="glass-card w-full max-w-[36rem] px-6 py-5 sm:px-7">
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-6">
        <Figure label="You send" value={formatCurrencyFromCents(SEND_CENTS)} />
        <Figure label="Fee" value={formatCurrencyFromCents(FEE_CENTS)} />
        <Figure label="They receive" value={formatCurrencyFromCents(SEND_CENTS)} emphasis />
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-hairline pt-4">
        <span className="size-1.5 rounded-full bg-success" />
        <span className="text-xs font-medium text-success">Settles instantly</span>
      </div>
    </div>
  );
}

function Figure({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    // A label/value row on phones, a column from sm up: three columns of
    // nine-figure VND do not fit a 375px card.
    <div className="flex min-w-0 items-baseline justify-between gap-4 sm:block">
      <p className="field-label">{label}</p>
      <p
        className={`figure-lg truncate text-lg sm:mt-1.5 sm:text-xl ${
          emphasis ? "text-primary-accent" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
