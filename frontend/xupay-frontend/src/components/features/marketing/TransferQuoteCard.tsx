import { formatCurrencyFromCents } from "@/lib/format";

/**
 * The hero's product card: the Agio "you send / rate / they receive" strip,
 * rebuilt around what XuPay actually does.
 *
 * XuPay is a domestic VND wallet, so there is no FX rate to show. Inventing
 * one would be a claim the product cannot make. The honest analogue of that
 * strip is the thing a ledger-accurate wallet can promise: what leaves, what
 * it costs, what lands - and for an internal transfer those first and last
 * figures are identical, which is the whole point of the page's headline.
 *
 * Amounts run through formatCurrencyFromCents, so this shows the same symbol
 * and two decimals the dashboard renders.
 */
const SEND_CENTS = 250_000_000;
const FEE_CENTS = 0;

export function TransferQuoteCard() {
  return (
    <div className="bezel w-full max-w-[46rem]">
      <div className="bezel-core--glass bezel-core px-6 py-5 sm:px-8 sm:py-6">
        <div className="grid gap-6 sm:grid-cols-[1.1fr_0.7fr_1.1fr_auto] sm:items-center sm:gap-8">
          <Figure label="You send" value={formatCurrencyFromCents(SEND_CENTS)} />
          <Figure label="Fee" value={formatCurrencyFromCents(FEE_CENTS)} />
          <Figure label="They receive" value={formatCurrencyFromCents(SEND_CENTS)} emphasis />
          <div className="flex items-center gap-2 rounded-full bg-success/10 px-4 py-2">
            <span className="size-1.5 rounded-full bg-success" />
            <span className="whitespace-nowrap text-xs font-medium text-success">
              Settles instantly
            </span>
          </div>
        </div>
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
    <div className="min-w-0">
      <p className="field-label">{label}</p>
      <p
        className={`figure-lg mt-1.5 truncate text-lg sm:text-xl ${
          emphasis ? "text-primary-accent" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
