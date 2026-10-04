import { userServiceClient } from "../client-factory";
import type { KycStatus, KycTier } from "./auth";

export interface ProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  kycStatus: KycStatus;
  kycTier: KycTier;
  isActive: boolean;
  // Observed omitted from the live response for a fresh account (likely
  // @JsonInclude(NON_DEFAULT) on the backend) — treat as optional rather
  // than assuming false/0.
  isSuspended?: boolean;
  fraudScore?: number;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
}

export interface UserLimitsResponse {
  kycTier: KycTier;
  dailySendLimitCents: number;
  dailyReceiveLimitCents: number;
  singleTransactionMaxCents: number;
  monthlyVolumeLimitCents: number;
  maxTransactionsPerDay: number;
  maxTransactionsPerHour: number;
  canSendInternational: boolean;
  canReceiveMerchantPayments: boolean;
}

/** Shape of user-service DailyUsageResponse (GET /api/users/me/daily-usage). */
export interface DailyUsageResponse {
  usageDate: string;
  totalSentCents: number;
  totalReceivedCents: number;
  /** Sends and receives today. */
  transactionCount: number;
  dailySendLimitCents: number;
  remainingSendLimitCents: number;
}

export async function getMyProfile(): Promise<ProfileResponse> {
  const { data } = await userServiceClient.get<ProfileResponse>("/api/users/me/profile");
  return data;
}

export async function updateMyProfile(payload: UpdateProfileRequest): Promise<ProfileResponse> {
  const { data } = await userServiceClient.put<ProfileResponse>("/api/users/me/profile", payload);
  return data;
}

export async function getMyLimits(): Promise<UserLimitsResponse> {
  const { data } = await userServiceClient.get<UserLimitsResponse>("/api/users/me/limits");
  return data;
}

export async function getMyDailyUsage(): Promise<DailyUsageResponse> {
  const { data } = await userServiceClient.get<DailyUsageResponse>("/api/users/me/daily-usage");
  return data;
}
