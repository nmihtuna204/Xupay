import { z } from "zod";

export const addContactSchema = z.object({
  contactUserId: z.string().min(1, "Enter a user ID").uuid("Enter a valid user ID (UUID)"),
  nickname: z.string().max(50, "Keep it under 50 characters").optional(),
});

export type AddContactFormValues = z.infer<typeof addContactSchema>;
