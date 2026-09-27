"use client";

import { LockKey } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { KycReviewQueue } from "@/components/features/kyc/KycReviewQueue";
import { useAuth } from "@/hooks/use-auth";
import { usePendingKycDocuments } from "@/hooks/queries/use-kyc";

export default function KycReviewPage() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "ADMIN";
  const pending = usePendingKycDocuments(isAdmin);

  return (
    <>
      <PageHeader
        title="KYC review"
        description="Approve identity documents to move users up a verification tier, or send them back with a reason."
      />
      <div className="panel p-6">
        {auth.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !isAdmin ? (
          // The route is public to signed-in users; the API is what enforces
          // the role (403 for anyone else), this just says so politely.
          <EmptyState
            icon={LockKey}
            title="Reviewers only"
            description="This queue is available to XuPay administrators."
          />
        ) : pending.data ? (
          <KycReviewQueue documents={pending.data} />
        ) : pending.isError ? (
          <ErrorState title="Couldn't load the review queue" error={pending.error} onRetry={() => pending.refetch()} />
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </div>
    </>
  );
}
