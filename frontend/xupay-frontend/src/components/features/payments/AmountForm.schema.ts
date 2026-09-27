import { z } from "zod";

/**
 * An amount the backend will accept once converted to integer cents: at least
 * 1 cent (0.001 would round to 0 and be rejected with a generic 400) and
 * small enough that amount * 100 stays an exact integer in a JS number and
 * fits the backend's Long.
 */
export const moneyAmount = z.coerce
  .number()
  .positive("Enter an amount greater than 0")
  .refine((v) => Math.round(v * 100) >= 1, "The smallest amount is 0.01")
  .refine((v) => v * 100 <= Number.MAX_SAFE_INTEGER, "That amount is too large");

export const amountSchema = z.object({
  amount: moneyAmount,
  description: z.string().max(200, "Keep it under 200 characters").optional(),
});

// z.coerce.number() makes the schema's *input* type `unknown` while the
// *output* type is `number` — react-hook-form's resolver needs both ends
// typed separately (input for the form fields/defaultValues, output for
// what onSubmit receives) or TypeScript rejects the resolver assignment.
export type AmountFormValues = z.infer<typeof amountSchema>;
export type AmountFormInput = z.input<typeof amountSchema>;
