"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useUploadKycDocument } from "@/hooks/mutations/use-kyc-mutations";
import { kycUploadSchema, type KycUploadFormValues } from "./KycUploader.schema";

const DOCUMENT_OPTIONS = [
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's license" },
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "UTILITY_BILL", label: "Utility bill" },
  { value: "SELFIE", label: "Selfie" },
] as const;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function KycUploader() {
  const uploadMutation = useUploadKycDocument();

  const form = useForm<KycUploadFormValues>({
    resolver: zodResolver(kycUploadSchema),
    defaultValues: { documentType: "NATIONAL_ID", documentNumber: "", documentCountry: "" },
  });

  async function onSubmit(values: KycUploadFormValues) {
    try {
      // No object-storage service exists in this stack — the file is
      // encoded as a data URL and used directly as `fileUrl`, which keeps
      // the rest of the KYC flow (upload -> list -> verification status)
      // genuinely wired to the real backend end to end.
      const fileUrl = await fileToDataUrl(values.file);
      await uploadMutation.mutateAsync({
        documentType: values.documentType,
        documentNumber: values.documentNumber || undefined,
        documentCountry: values.documentCountry || undefined,
        fileUrl,
        fileSizeBytes: values.file.size,
        mimeType: values.file.type,
      });
      toast.success("Document submitted for review");
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="glass-card flex max-w-lg flex-col gap-4 p-6"
      >
        <FormField
          control={form.control}
          name="documentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DOCUMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="documentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document number (optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="documentCountry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="VNM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                {/* A file input can't be value-controlled, so RHF's `value`
                    is intentionally not forwarded; we hand back the File on
                    change and wire the remaining field props explicitly. */}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  disabled={field.disabled}
                  onChange={(e) => field.onChange(e.target.files?.[0])}
                />
              </FormControl>
              <FormDescription>JPG, PNG, WEBP, or PDF — up to 5MB.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={uploadMutation.isPending} className="mt-1">
          {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
          Submit for review
        </Button>
      </form>
    </Form>
  );
}
