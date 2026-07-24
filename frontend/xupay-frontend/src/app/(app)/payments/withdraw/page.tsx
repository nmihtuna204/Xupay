import { PageHeader } from "@/components/layout/PageHeader";
import { WithdrawForm } from "@/components/features/payments/WithdrawForm";

export default function WithdrawPage() {
  return (
    <>
      <PageHeader title="Withdraw" description="Move funds out of your wallet." />
      <WithdrawForm />
    </>
  );
}
