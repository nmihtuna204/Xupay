"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ContactForm } from "@/components/features/contacts/ContactForm";
import { ContactList } from "@/components/features/contacts/ContactList";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { useContacts } from "@/hooks/queries/use-contacts";

export default function ContactsPage() {
  const contactsQuery = useContacts();

  return (
    <>
      <PageHeader
        title="Contacts"
        description="People you send money to often."
        action={<ContactForm />}
      />
      {contactsQuery.data ? (
        <ContactList contacts={contactsQuery.data} />
      ) : contactsQuery.isError ? (
        <ErrorState
          title="Couldn't load your contacts"
          error={contactsQuery.error}
          onRetry={() => contactsQuery.refetch()}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}
    </>
  );
}
