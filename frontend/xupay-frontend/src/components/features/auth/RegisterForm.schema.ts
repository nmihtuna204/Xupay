import { z } from "zod";

// Mirrors the backend's password policy (see docs/api/USER_SERVICE_API_DOCUMENTATION.md
// example: "P@ssword123") — at least 8 chars, upper, lower, digit, symbol.
const passwordPolicy = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number")
  .regex(/[^a-zA-Z0-9]/, "Add a symbol");

// E.164 format, e.g. +84901234567
const e164Phone = /^\+[1-9]\d{6,14}$/;

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || e164Phone.test(v), "Use international format, e.g. +84901234567"),
    password: passwordPolicy,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
