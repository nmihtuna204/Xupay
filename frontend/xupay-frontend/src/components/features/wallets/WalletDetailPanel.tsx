"use client";

import { useState } from "react";
import { Copy, Snowflake, Sun } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyFromCents } from "@/lib/format";
import { useFreezeWallet } from "@/hooks/mutations/use-wallet-mutations";
import type { WalletBalanceResponse } from "@/lib/api/payment-service/wallets";

export function WalletDetailPanel({ wallet }: { wallet: WalletBalanceResponse }) {
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const freezeMutation = useFreezeWallet(wallet.walletId);

  function copyId() {
    navigator.clipboard.writeText(wallet.walletId);
    toast.success("Wallet ID copied");
  }

  function toggleFreeze() {
    freezeMutation.mutate(
      { freeze: !wallet.isFrozen, reason: wallet.isFrozen ? undefined : reason || undefined },
      {
        onSuccess: () => {
          toast.success(wallet.isFrozen ? "Wallet unfrozen" : "Wallet frozen");
          setDialogOpen(false);
          setReason("");
        },
        onError: (error) => toast.error(error.message || "Couldn't update wallet"),
      }
    );
  }

  return (
    <div className="panel panel-lit p-6 sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="kicker">Personal wallet</p>
          {/* Same phone-safe floor and last-resort wrap as the dashboard card. */}
          <p className="figure-lg mt-4 text-[clamp(2rem,5vw,4rem)] leading-none [overflow-wrap:anywhere]">
            {formatCurrencyFromCents(wallet.balanceCents, wallet.currency)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <button onClick={copyId} className="flex items-center gap-1 hover:text-foreground">
              {wallet.walletId} <Copy weight="light" className="size-3" />
            </button>
            <span>·</span>
            <span>{wallet.currency}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {wallet.isFrozen ? (
            <StatusBadge tone="warning" label="Frozen" />
          ) : (
            <StatusBadge tone="success" label="Active" />
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {wallet.isFrozen ? (
                  <>
                    <Sun weight="light" /> Unfreeze
                  </>
                ) : (
                  <>
                    <Snowflake weight="light" /> Freeze
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{wallet.isFrozen ? "Unfreeze wallet" : "Freeze wallet"}</DialogTitle>
                <DialogDescription>
                  {wallet.isFrozen
                    ? "This wallet will be able to send and receive funds again."
                    : "Freezing blocks all sends, deposits, and withdrawals until unfrozen."}
                </DialogDescription>
              </DialogHeader>
              {!wallet.isFrozen && (
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Suspicious activity"
                  />
                </div>
              )}
              <DialogFooter>
                <Button
                  variant={wallet.isFrozen ? "default" : "destructive"}
                  onClick={toggleFreeze}
                  disabled={freezeMutation.isPending}
                >
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
