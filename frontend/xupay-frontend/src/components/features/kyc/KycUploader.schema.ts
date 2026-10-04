import { z } from "zod";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const kycUploadSchema = z.object({
  documentType: z.enum(["PASSPORT", "DRIVERS_LICENSE", "NATIONAL_ID", "UTILITY_BILL", "SELFIE"]),
  documentNumber: z.string().max(64).optional(),
  // The API requires exactly three letters (ISO 3166-1 alpha-3); "VN" used to
  // pass here and come back as a raw "Validation failed" toast.
  documentCountry: z
    .string()
    .optional()
    .refine((v) => !v || /^[A-Za-z]{3}$/.test(v), "Use a 3-letter code, e.g. VNM"),
  file: z
    .instanceof(File, { message: "Choose a file" })
    .refine((f) => f.size <= MAX_FILE_BYTES, "File must be under 5MB")
    .refine((f) => ACCEPTED_TYPES.includes(f.type), "Use JPG, PNG, WEBP, or PDF"),
});

export type KycUploadFormValues = z.infer<typeof kycUploadSchema>;
