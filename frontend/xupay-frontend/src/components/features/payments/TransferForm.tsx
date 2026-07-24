"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTransfer } from "@/hooks/mutations/use-payment-mutations";
import { useContacts } from "@/hooks/queries/use-contacts";
import { useAuth } from "@/hooks/use-auth";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { cn } from "@/lib/utils";
import { initialsFromName } from "@/lib/format";
import { transferSchema, type TransferFormValues, type TransferFormInput } from "./TransferForm.schema";

export function TransferForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const contactsQuery = useContacts();
  const transferMutation = useTransfer();
  const idempotencyKey = useIdempotencyKey();

  const form = useForm<TransferFormInput, unknown, TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { recipientUserId: searchParams.get("to") ?? "", amount: 0, description: "" },
  });

  function onSubmit(values: TransferFormValues) {
    if (!user) return;
    transferMutation.mutate(
      {
        idempotencyKey,
        fromUserId: user.id,
        toUserId: values.recipientUserId,
        amountCents: Math.round(values.amount * 100),
        description: values.description || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success("Transfer sent");
          router.push(`/transactions/${data.transactionId}`);
        },
        onError: (error) => toast.error(error.message || "Transfer failed"),
      }
    );
  }

  const selectedRecipient = useWatch({ control: form.control, name: "recipientUserId" });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="glass-card flex max-w-lg flex-col gap-5 p-6">
        {contactsQuery.data && contactsQuery.data.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Send to a contact</p>
            <div className="flex flex-wrap gap-2">
              {contactsQuery.data.map((contact) => (
                <button
                  type="button"
                  key={contact.id}
                  onClick={() => form.setValue("recipientUserId", contact.contactUserId, { shouldValidate: true })}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface-hover",
                    selectedRecipient === contact.contactUserId && "border-primary bg-primary/10"
                  )}
                >
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">
                      {initialsFromName(contact.contactName)}
                    </AvatarFallback>
                  </Avatar>
                  {contact.nickname || contact.contactName}
                </button>
              ))}
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="recipientUserId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient user ID</FormLabel>
              <FormControl>
                <Input placeholder="11111111-1111-1111-1111-111111111111" {...field} />
              </FormControl>
              <FormDescription>
                Pick a contact above, or paste their user ID directly.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
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
              <FormLabel>What&apos;s it for? (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Dinner split" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={transferMutation.isPending} className="mt-1">
          {transferMutation.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          Send money
        </Button>
      </form>
    </Form>
  );
}
