import type { Metadata } from "next";
import { RegisterForm } from "@/components/features/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account — XuPay" };

export default function RegisterPage() {
  return <RegisterForm />;
}
