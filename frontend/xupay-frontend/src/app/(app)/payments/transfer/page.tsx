import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransferForm } from "@/components/features/payments/TransferForm";

export default function TransferPage() {
  return (
    <>
      <PageHeader title="Send money" description="Transfer funds to another XuPay user." />
      <Suspense>
        <TransferForm />
      </Suspense>
    </>
  );
}
