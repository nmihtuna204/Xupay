"use client";

import { useState } from "react";
import { Copy, Snowflake, Sun } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
    <div className="glass-card relative overflow-hidden p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-gradient-to-br from-accent-from/20 to-accent-to/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Personal wallet</p>
          <p className="figure-lg mt-2 text-5xl">
            {formatCurrencyFromCents(wallet.balanceCents, wallet.currency)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <button onClick={copyId} className="flex items-center gap-1 hover:text-foreground">
              {wallet.walletId} <Copy className="size-3" />
            </button>
            <span>·</span>
            <span>{wallet.currency}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {wallet.isFrozen ? (
            <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
              <Snowflake className="size-3" /> Frozen
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-success/40 text-success">
              Active
            </Badge>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {wallet.isFrozen ? (
                  <>
                    <Sun /> Unfreeze
                  </>
                ) : (
                  <>
                    <Snowflake /> Freeze
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
