import { WalletDetailClient } from "./WalletDetailClient";

// Next.js 16: dynamic route `params` are always a Promise now (sync access
// was fully removed, not just deprecated).
export default async function WalletDetailPage({
  params,
}: {
  params: Promise<{ walletId: string }>;
}) {
  const { walletId } = await params;
  return <WalletDetailClient walletId={walletId} />;
}
