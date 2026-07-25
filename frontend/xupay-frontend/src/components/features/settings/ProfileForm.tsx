"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useUpdateProfile } from "@/hooks/mutations/use-profile-mutations";
import { profileSchema, type ProfileFormValues } from "./ProfileForm.schema";
import type { ProfileResponse } from "@/lib/api/user-service/profile";

export function ProfileForm({ profile }: { profile: ProfileResponse }) {
  const updateMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      nationality: profile.nationality ?? "",
    },
  });

  // Re-sync if the underlying profile data changes (e.g. refetch after save).
  useEffect(() => {
    form.reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      nationality: profile.nationality ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function onSubmit(values: ProfileFormValues) {
    updateMutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        nationality: values.nationality || undefined,
      },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (error) => toast.error(error.message || "Couldn't save changes"),
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="panel flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+84901234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <FormControl>
                  <Input placeholder="VNM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={updateMutation.isPending} className="mt-1 self-start">
          {updateMutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Save changes
        </Button>
      </form>
    </Form>
  );
}
