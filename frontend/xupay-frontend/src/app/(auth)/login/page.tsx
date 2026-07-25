import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/features/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in · XuPay" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
