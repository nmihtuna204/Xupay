import { PageHeader } from "@/components/layout/PageHeader";
import { DepositForm } from "@/components/features/payments/DepositForm";

export default function DepositPage() {
  return (
    <>
      <PageHeader title="Deposit" description="Add funds to your wallet." />
      <DepositForm />
    </>
  );
}
