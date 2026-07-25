"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/features/settings/ProfileForm";
import { LimitsCard } from "@/components/features/settings/LimitsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyProfile, useMyLimits } from "@/hooks/queries/use-profile";

export default function SettingsPage() {
  const profileQuery = useMyProfile();
  const limitsQuery = useMyLimits();

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and view your limits." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-medium">Profile</h2>
          {profileQuery.isLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : profileQuery.data ? (
            <ProfileForm profile={profileQuery.data} />
          ) : null}
        </div>
        <div>
          <h2 className="mb-3 font-medium">Limits</h2>
          {limitsQuery.isLoading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : limitsQuery.data ? (
            <LimitsCard limits={limitsQuery.data} />
          ) : null}
        </div>
      </div>
    </>
  );
}
