"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useWithdraw } from "@/hooks/mutations/use-payment-mutations";
import { useAuth } from "@/hooks/use-auth";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { amountSchema, type AmountFormValues, type AmountFormInput } from "./AmountForm.schema";

export function WithdrawForm() {
  const router = useRouter();
  const { user } = useAuth();
  const withdrawMutation = useWithdraw();
  const idempotencyKey = useIdempotencyKey();

  const form = useForm<AmountFormInput, unknown, AmountFormValues>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: 0, description: "" },
  });

  function onSubmit(values: AmountFormValues) {
    if (!user) return;
    withdrawMutation.mutate(
      {
        idempotencyKey,
        userId: user.id,
        amountCents: Math.round(values.amount * 100),
        description: values.description || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success("Withdrawal complete");
          router.push(`/transactions/${data.transactionId}`);
        },
        onError: (error) => toast.error(error.message || "Withdrawal failed"),
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="glass-card flex max-w-lg flex-col gap-5 p-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount to withdraw</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₫
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-7"
                    {...field}
                    value={field.value as string | number}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. ATM withdrawal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" variant="outline" disabled={withdrawMutation.isPending} className="mt-1">
          {withdrawMutation.isPending ? <Loader2 className="animate-spin" /> : <Banknote />}
          Withdraw
        </Button>
      </form>
    </Form>
  );
}
