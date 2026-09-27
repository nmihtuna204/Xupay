"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { KycUploader } from "@/components/features/kyc/KycUploader";
import { DocumentList } from "@/components/features/kyc/DocumentList";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { useAuth } from "@/hooks/use-auth";
import { useKycDocuments } from "@/hooks/queries/use-kyc";

const KYC_TIER_LABEL: Record<string, string> = {
  TIER_0: "Unverified",
  TIER_1: "Basic",
  TIER_2: "Verified",
  TIER_3: "Premium",
};

export default function KycPage() {
  const { user } = useAuth();
  const documentsQuery = useKycDocuments();

  return (
    <>
      <PageHeader
        title="KYC verification"
        description={
          user
            ? `Current tier: ${KYC_TIER_LABEL[user.kycTier] ?? user.kycTier}`
            : "Verify your identity to raise your transaction limits."
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-medium">Upload a document</h2>
          <KycUploader />
        </div>
        <div>
          <h2 className="mb-3 font-medium">Your documents</h2>
          {documentsQuery.data ? (
            <DocumentList documents={documentsQuery.data} />
          ) : documentsQuery.isError ? (
            <ErrorState
              title="Couldn't load your documents"
              error={documentsQuery.error}
              onRetry={() => documentsQuery.refetch()}
            />
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
