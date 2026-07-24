import { z } from "zod";

export const amountSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  description: z.string().max(200, "Keep it under 200 characters").optional(),
});

// z.coerce.number() makes the schema's *input* type `unknown` while the
// *output* type is `number` — react-hook-form's resolver needs both ends
// typed separately (input for the form fields/defaultValues, output for
// what onSubmit receives) or TypeScript rejects the resolver assignment.
export type AmountFormValues = z.infer<typeof amountSchema>;
export type AmountFormInput = z.input<typeof amountSchema>;
