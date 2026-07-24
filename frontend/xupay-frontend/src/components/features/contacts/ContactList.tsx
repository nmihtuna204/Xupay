"use client";

import Link from "next/link";
import { Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { useRemoveContact } from "@/hooks/mutations/use-contact-mutations";
import { toast } from "sonner";
import { initialsFromName } from "@/lib/format";
import type { ContactResponse } from "@/lib/api/user-service/contacts";

export function ContactList({ contacts }: { contacts: ContactResponse[] }) {
  const removeMutation = useRemoveContact();

  if (contacts.length === 0) {
    return (
      <EmptyState
        title="No contacts yet"
        description="Add someone's user ID to send them money quickly next time."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {contacts.map((contact) => (
        <div key={contact.id} className="glass-card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-accent-from to-accent-to text-white">
                {initialsFromName(contact.contactName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{contact.nickname || contact.contactName}</p>
              <p className="text-xs text-muted-foreground">
                {contact.totalTransactions} transaction{contact.totalTransactions === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href={`/payments/transfer?to=${contact.contactUserId}`}>
                <Send />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                removeMutation.mutate(contact.id, {
                  onSuccess: () => toast.success("Contact removed"),
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
