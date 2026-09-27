import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/api/errors";

/**
 * The failure counterpart to EmptyState, and deliberately never confused with
 * it. A request that failed is not a collection that is empty: telling someone
 * with money in their wallet "No wallet found" because the network dropped is
 * the worst message a payments screen can show. So a failed load says it
 * failed, says nothing changed, and offers the retry.
 */
export function ErrorState({
  title,
  error,
  onRetry,
  className,
}: {
  title: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const offline = error !== undefined && toApiError(error).statusCode === 0;

  return (
    <div role="alert" className={className}>
      <EmptyState
        icon={WarningCircle}
        title={title}
        description={
          offline
            ? "We couldn't reach XuPay. Check your connection and try again. Nothing was changed."
            : "Something went wrong on our side. Try again in a moment. Nothing was changed."
        }
        action={
          onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <ArrowClockwise weight="light" /> Try again
            </Button>
          )
        }
      />
    </div>
  );
}
