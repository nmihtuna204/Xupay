"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAddContact } from "@/hooks/mutations/use-contact-mutations";
import { addContactSchema, type AddContactFormValues } from "./ContactForm.schema";

export function ContactForm() {
  const [open, setOpen] = useState(false);
  const addContactMutation = useAddContact();

  const form = useForm<AddContactFormValues>({
    resolver: zodResolver(addContactSchema),
    defaultValues: { contactUserId: "", nickname: "" },
  });

  function onSubmit(values: AddContactFormValues) {
    addContactMutation.mutate(
      { contactUserId: values.contactUserId, nickname: values.nickname || undefined },
      {
        onSuccess: () => {
          toast.success("Contact added");
          form.reset();
          setOpen(false);
        },
        onError: (error) => toast.error(error.message || "Couldn't add contact"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Add contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a contact</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="contactUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="11111111-1111-1111-1111-111111111111" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Roommate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={addContactMutation.isPending}>
              {addContactMutation.isPending && <Loader2 className="animate-spin" />}
              Add contact
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
