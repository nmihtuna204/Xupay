import { userServiceClient } from "../client-factory";

// Shape verified against the live user-service: the contact's name comes
// back as a single `contactName` field (e.g. "An Nguyen"), NOT firstName/
// lastName — so display code must use contactName and derive initials from it.
export interface ContactResponse {
  id: string;
  contactUserId: string;
  contactName: string;
  nickname?: string;
  totalTransactions: number;
  isFavorite: boolean;
}

export interface AddContactRequest {
  contactUserId: string;
  nickname?: string;
}

export async function getMyContacts(): Promise<ContactResponse[]> {
  const { data } = await userServiceClient.get<ContactResponse[]>("/api/users/me/contacts");
  return data;
}

export async function addContact(payload: AddContactRequest): Promise<ContactResponse> {
  const { data } = await userServiceClient.post<ContactResponse>("/api/users/me/contacts", payload);
  return data;
}

export async function removeContact(contactId: string): Promise<void> {
  await userServiceClient.delete(`/api/users/me/contacts/${contactId}`);
}
