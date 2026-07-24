"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addContact, removeContact, type AddContactRequest } from "@/lib/api/user-service/contacts";
import { contactKeys } from "@/lib/query-keys";

export function useAddContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddContactRequest) => addContact(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKeys.all }),
  });
}

export function useRemoveContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => removeContact(contactId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKeys.all }),
  });
}
