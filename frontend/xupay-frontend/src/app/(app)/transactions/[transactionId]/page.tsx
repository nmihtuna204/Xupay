import { TransactionDetailClient } from "./TransactionDetailClient";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = await params;
  return <TransactionDetailClient transactionId={transactionId} />;
}
