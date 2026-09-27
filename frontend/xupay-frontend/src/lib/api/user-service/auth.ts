import { userServiceClient } from "../client-factory";

export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type KycTier = "TIER_0" | "TIER_1" | "TIER_2" | "TIER_3";
/** ADMIN can review KYC documents; everyone else is USER. */
export type UserRole = "USER" | "ADMIN";

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  kycStatus: KycStatus;
  kycTier: KycTier;
  role?: UserRole;
  isActive: boolean;
  createdAt: string;
}

/**
 * The real backend response for register/login does NOT match the
 * documented `{accessToken, expiresAt, user}` shape — verified by hitting
 * the live service directly. It's flat: `token` (not `accessToken`),
 * `expiresIn` (seconds, not an ISO `expiresAt`), and only `userId`/`email` —
 * no nested user object with firstName/lastName/kycStatus/etc. Callers must
 * follow up with `getCurrentUser()` to get the full profile.
 */
export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await userServiceClient.post<AuthResponse>("/api/auth/register", payload);
  return data;
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await userServiceClient.post<AuthResponse>("/api/auth/login", payload);
  return data;
}

export async function logout(): Promise<void> {
  await userServiceClient.post("/api/auth/logout").catch(() => undefined);
}

export async function getCurrentUser(): Promise<UserResponse> {
  const { data } = await userServiceClient.get<UserResponse>("/api/auth/me");
  return data;
}
