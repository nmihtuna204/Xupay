import { z } from "zod";

const e164Phone = /^\+[1-9]\d{6,14}$/;

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || e164Phone.test(v), "Use international format, e.g. +84901234567"),
  dateOfBirth: z.string().optional(),
  nationality: z
    .string()
    .optional()
    .refine((v) => !v || /^[A-Za-z]{3}$/.test(v), "Use a 3-letter code, e.g. VNM"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
