import { paymentServiceClient } from "../client-factory";

/** payment-service WalletType ("ESCROW" was never one: the API answered it with a 400). */
export type WalletType = "PERSONAL" | "BUSINESS" | "MERCHANT";

export interface WalletBalanceResponse {
  walletId: string;
  userId: string;
  balanceCents: number;
  balanceAmount?: number;
  currency: string;
  isActive: boolean;
  isFrozen: boolean;
}

export interface CreateWalletRequest {
  userId: string;
  walletType: WalletType;
  currency: string;
}

export interface CreateWalletResponse {
  walletId: string;
  userId: string;
  glAccountCode?: string;
  walletType: WalletType;
  currency: string;
  balanceCents: number;
  isActive: boolean;
  createdAt?: string;
}

export interface FreezeWalletRequest {
  freeze: boolean;
  reason?: string;
}

export async function createWallet(payload: CreateWalletRequest): Promise<CreateWalletResponse> {
  const { data } = await paymentServiceClient.post<CreateWalletResponse>("/api/wallets", payload);
  return data;
}

export async function getWalletByUserId(userId: string): Promise<WalletBalanceResponse> {
  const { data } = await paymentServiceClient.get<WalletBalanceResponse>(
    `/api/wallets/user/${userId}`
  );
  return data;
}

export async function getWalletBalance(walletId: string): Promise<WalletBalanceResponse> {
  const { data } = await paymentServiceClient.get<WalletBalanceResponse>(
    `/api/wallets/${walletId}/balance`
  );
  return data;
}

export async function freezeWallet(walletId: string, payload: FreezeWalletRequest): Promise<void> {
  await paymentServiceClient.put(`/api/wallets/${walletId}/freeze`, payload);
}
