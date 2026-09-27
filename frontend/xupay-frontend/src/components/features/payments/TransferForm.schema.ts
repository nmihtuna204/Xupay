import { z } from "zod";
import { moneyAmount } from "./AmountForm.schema";

export const transferSchema = z.object({
  recipientUserId: z
    .string()
    .min(1, "Choose or enter a recipient")
    .uuid("Enter a valid user ID (UUID)"),
  amount: moneyAmount,
  description: z.string().max(200, "Keep it under 200 characters").optional(),
});

export type TransferFormValues = z.infer<typeof transferSchema>;
export type TransferFormInput = z.input<typeof transferSchema>;
